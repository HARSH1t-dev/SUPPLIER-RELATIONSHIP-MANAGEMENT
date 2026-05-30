<?php

declare(strict_types=1);

namespace Srm;

use PDO;
use RuntimeException;

final class RfqService
{
    public const RFQ_STATUS_DRAFT = 'Draft';
    public const RFQ_STATUS_OPEN = 'Open';
    public const RFQ_STATUS_EVALUATING = 'Evaluating';
    public const RFQ_STATUS_AWARDED = 'Awarded';
    public const RFQ_STATUS_CANCELLED = 'Cancelled';

    public const DEMO_SUPPLIER_NAME = 'Summit Precision Tools';
    public const DEMO_SUPPLIER_RATING = 4.7;

    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::connection();
    }

    public function health(): array
    {
        $rfqCount = (int) $this->db->query('SELECT COUNT(*) FROM rfqs')->fetchColumn();
        $bidCount = (int) $this->db->query('SELECT COUNT(*) FROM bids')->fetchColumn();

        return [
            'ok' => true,
            'service' => 'srm-rfq-api-php',
            'rfqCount' => $rfqCount,
            'bidCount' => $bidCount,
        ];
    }

    public function getState(): array
    {
        return [
            'rfqs' => $this->listRfqs(),
            'bids' => $this->allBids(),
        ];
    }

    public function listRfqs(?string $visibility = null): array
    {
        $sql = 'SELECT r.*, (SELECT COUNT(*) FROM bids b WHERE b.rfq_id = r.id) AS bids
                FROM rfqs r ORDER BY r.created_at DESC';
        $rows = $this->db->query($sql)->fetchAll();
        $rfqs = array_map([$this, 'mapRfq'], $rows);

        if ($visibility === 'supplier') {
            return array_values(array_filter(
                $rfqs,
                fn (array $rfq) => in_array($rfq['status'], [self::RFQ_STATUS_OPEN, self::RFQ_STATUS_EVALUATING], true),
            ));
        }

        return $rfqs;
    }

    public function getRfq(string $id): ?array
    {
        $rfq = $this->findRfq($id);
        if ($rfq === null) {
            return null;
        }

        return [
            'rfq' => $rfq,
            'scoredBids' => $this->getScoredBidsForRfq($id),
            'actions' => $this->getNextStatusActions($rfq),
        ];
    }

    public function getScoredBidsForRfq(string $rfqId): array
    {
        $bids = $this->bidsForRfq($rfqId);
        if ($bids === []) {
            return [];
        }

        $scored = array_map(function (array $bid) use ($bids) {
            $bid['score'] = $this->computeBidScore($bid, $bids);
            return $bid;
        }, $bids);

        $topScore = max(array_column($scored, 'score'));

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_map(
            fn (array $bid) => array_merge($bid, ['best' => $bid['score'] === $topScore]),
            $scored,
        );
    }

    public function createRfq(array $payload): array
    {
        $id = $this->nextRfqId();
        $stmt = $this->db->prepare(
            'INSERT INTO rfqs (id, title, category, deadline, value, description, status, created_at)
             VALUES (:id, :title, :category, :deadline, :value, :description, :status, :created_at)',
        );

        $stmt->execute([
            'id' => $id,
            'title' => trim((string) ($payload['title'] ?? '')) ?: 'Untitled sourcing request',
            'category' => $payload['category'] ?? 'Manufacturing',
            'deadline' => $payload['deadline'] ?? 'TBD',
            'value' => (float) ($payload['value'] ?? 0),
            'description' => trim((string) ($payload['description'] ?? '')),
            'status' => self::RFQ_STATUS_DRAFT,
            'created_at' => gmdate('Y-m-d H:i:s'),
        ]);

        $rfq = $this->findRfq($id);
        if ($rfq === null) {
            throw new RuntimeException('Failed to create RFQ.');
        }

        return ['result' => $rfq, 'error' => null];
    }

    public function updateRfq(string $id, array $payload): array
    {
        $existing = $this->findRfq($id);
        if ($existing === null) {
            return ['result' => null, 'error' => null];
        }

        $stmt = $this->db->prepare(
            'UPDATE rfqs SET title = :title, category = :category, deadline = :deadline,
             value = :value, description = :description WHERE id = :id',
        );

        $stmt->execute([
            'id' => $id,
            'title' => trim((string) ($payload['title'] ?? $existing['title'])) ?: $existing['title'],
            'category' => $payload['category'] ?? $existing['category'],
            'deadline' => $payload['deadline'] ?? $existing['deadline'],
            'value' => array_key_exists('value', $payload) ? (float) $payload['value'] : (float) $existing['value'],
            'description' => array_key_exists('description', $payload)
                ? (string) $payload['description']
                : (string) ($existing['description'] ?? ''),
        ]);

        return ['result' => $this->findRfq($id), 'error' => null];
    }

    public function updateRfqStatus(string $id, string $status): array
    {
        $rfq = $this->findRfq($id);
        if ($rfq === null) {
            return ['result' => null, 'error' => 'RFQ not found.'];
        }

        if ($status === self::RFQ_STATUS_EVALUATING && (int) $rfq['bids'] < 1) {
            return [
                'result' => null,
                'error' => 'At least one supplier bid is required before closing for evaluation.',
            ];
        }

        $allowed = array_column($this->getNextStatusActions($rfq), 'status');
        if (!in_array($status, $allowed, true) && $rfq['status'] !== $status) {
            return ['result' => null, 'error' => "Cannot transition from {$rfq['status']} to {$status}."];
        }

        $stmt = $this->db->prepare('UPDATE rfqs SET status = :status WHERE id = :id');
        $stmt->execute(['status' => $status, 'id' => $id]);

        return ['result' => $this->findRfq($id), 'error' => null];
    }

    public function deleteRfq(string $id): array
    {
        $rfq = $this->findRfq($id);
        if ($rfq === null) {
            return ['result' => false, 'error' => null];
        }

        if ($rfq['status'] !== self::RFQ_STATUS_DRAFT) {
            return ['result' => false, 'error' => 'Only draft RFQs can be deleted.'];
        }

        $stmt = $this->db->prepare('DELETE FROM rfqs WHERE id = :id');
        $stmt->execute(['id' => $id]);

        return ['result' => true, 'error' => null];
    }

    public function listBids(?string $supplier = null, ?string $rfqId = null): array
    {
        $sql = 'SELECT * FROM bids WHERE 1=1';
        $params = [];

        if ($supplier !== null && $supplier !== '') {
            $sql .= ' AND supplier = :supplier';
            $params['supplier'] = $supplier;
        }

        if ($rfqId !== null && $rfqId !== '') {
            $sql .= ' AND rfq_id = :rfq_id';
            $params['rfq_id'] = $rfqId;
        }

        $sql .= ' ORDER BY submitted_at DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return [
            'bids' => array_map([$this, 'mapBid'], $stmt->fetchAll()),
            'rfqs' => $this->listRfqs(),
        ];
    }

    public function submitBid(string $rfqId, array $payload): array
    {
        $rfq = $this->findRfq($rfqId);
        if ($rfq === null) {
            return ['result' => null, 'error' => 'RFQ not found.'];
        }

        if ($rfq['status'] !== self::RFQ_STATUS_OPEN) {
            return ['result' => null, 'error' => 'This RFQ is not open for bids.'];
        }

        $supplier = $payload['supplierName'] ?? self::DEMO_SUPPLIER_NAME;
        $check = $this->db->prepare('SELECT id FROM bids WHERE rfq_id = :rfq_id AND supplier = :supplier LIMIT 1');
        $check->execute(['rfq_id' => $rfqId, 'supplier' => $supplier]);
        if ($check->fetch()) {
            return ['result' => null, 'error' => 'You have already submitted a bid for this RFQ.'];
        }

        $price = (float) ($payload['price'] ?? 0);
        if ($price <= 0) {
            return ['result' => null, 'error' => 'Enter a valid quoted price.'];
        }

        $id = $this->nextBidId();
        $stmt = $this->db->prepare(
            'INSERT INTO bids (id, rfq_id, supplier, price, delivery, warranty, rating, submitted_at)
             VALUES (:id, :rfq_id, :supplier, :price, :delivery, :warranty, :rating, :submitted_at)',
        );

        $stmt->execute([
            'id' => $id,
            'rfq_id' => $rfqId,
            'supplier' => $supplier,
            'price' => $price,
            'delivery' => trim((string) ($payload['delivery'] ?? '')) ?: '30 days',
            'warranty' => trim((string) ($payload['warranty'] ?? '')) ?: '12 months',
            'rating' => (float) ($payload['rating'] ?? self::DEMO_SUPPLIER_RATING),
            'submitted_at' => gmdate('Y-m-d H:i:s'),
        ]);

        $bid = $this->findBid($id);
        return ['result' => $bid, 'error' => null];
    }

    public function awardBid(string $rfqId, string $bidId): array
    {
        $rfq = $this->findRfq($rfqId);
        $bid = $this->findBid($bidId);

        if ($rfq === null || $bid === null || $bid['rfqId'] !== $rfqId) {
            return ['result' => null, 'error' => 'RFQ or bid not found.'];
        }

        if (!in_array($rfq['status'], [self::RFQ_STATUS_EVALUATING, self::RFQ_STATUS_OPEN], true)) {
            return ['result' => null, 'error' => 'Award is only available while evaluating bids.'];
        }

        $stmt = $this->db->prepare(
            'UPDATE rfqs SET status = :status, awarded_supplier = :supplier,
             awarded_bid_id = :bid_id, awarded_amount = :amount WHERE id = :id',
        );
        $stmt->execute([
            'status' => self::RFQ_STATUS_AWARDED,
            'supplier' => $bid['supplier'],
            'bid_id' => $bidId,
            'amount' => $bid['price'],
            'id' => $rfqId,
        ]);

        return ['result' => $this->findRfq($rfqId), 'error' => null];
    }

    public function seedIfEmpty(): void
    {
        $count = (int) $this->db->query('SELECT COUNT(*) FROM rfqs')->fetchColumn();
        if ($count > 0) {
            return;
        }

        $rfqs = [
            ['RFQ-24061', 'Precision CNC Aluminum Housings', 'Manufacturing', '2026-06-05', 740000, 'High-precision aluminum housings.', 'Open'],
            ['RFQ-24062', 'Multi-region Freight Forwarding', 'Logistics', '2026-06-12', 1280000, 'Annual freight consolidation.', 'Evaluating'],
            ['RFQ-24063', 'Cleanroom Consumables Supply', 'Facilities', '2026-06-18', 420000, '', 'Draft'],
            ['RFQ-24064', 'Solar Inverter Maintenance', 'Services', '2026-05-30', 360000, 'Preventive maintenance contract.', 'Open'],
        ];

        $rfqStmt = $this->db->prepare(
            'INSERT INTO rfqs (id, title, category, deadline, value, description, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        );

        foreach ($rfqs as $row) {
            $rfqStmt->execute($row);
        }

        $seedBids = [
            ['BID-24001', 'RFQ-24061', 'Apex Industrial Components', 718000, '21 days', '24 months', 4.8],
            ['BID-24002', 'RFQ-24061', 'Vector Packaging Co.', 742500, '24 days', '18 months', 4.4],
            ['BID-24003', 'RFQ-24061', 'Northstar Logistics', 726800, '28 days', '24 months', 4.6],
            ['BID-24004', 'RFQ-24061', 'Helio Energy Systems', 755000, '20 days', '12 months', 4.1],
        ];

        $bidStmt = $this->db->prepare(
            'INSERT INTO bids (id, rfq_id, supplier, price, delivery, warranty, rating, submitted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))',
        );

        foreach ($seedBids as $index => $row) {
            $bidStmt->execute([...$row, $index + 1]);
        }
    }

    public function getNextStatusActions(array $rfq): array
    {
        switch ($rfq['status']) {
            case self::RFQ_STATUS_DRAFT:
                return [['label' => 'Publish RFQ', 'status' => self::RFQ_STATUS_OPEN, 'variant' => 'primary']];
            case self::RFQ_STATUS_OPEN:
                return [
                    [
                        'label' => 'Close for evaluation',
                        'status' => self::RFQ_STATUS_EVALUATING,
                        'variant' => 'secondary',
                        'requiresBids' => true,
                    ],
                    ['label' => 'Cancel RFQ', 'status' => self::RFQ_STATUS_CANCELLED, 'variant' => 'ghost'],
                ];
            case self::RFQ_STATUS_EVALUATING:
                return [['label' => 'Reopen bidding', 'status' => self::RFQ_STATUS_OPEN, 'variant' => 'secondary']];
            default:
                return [];
        }
    }

    private function findRfq(string $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT r.*, (SELECT COUNT(*) FROM bids b WHERE b.rfq_id = r.id) AS bids FROM rfqs r WHERE r.id = :id',
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->mapRfq($row) : null;
    }

    private function findBid(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM bids WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->mapBid($row) : null;
    }

    private function allBids(): array
    {
        $rows = $this->db->query('SELECT * FROM bids ORDER BY submitted_at DESC')->fetchAll();
        return array_map([$this, 'mapBid'], $rows);
    }

    private function bidsForRfq(string $rfqId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM bids WHERE rfq_id = :rfq_id ORDER BY submitted_at DESC');
        $stmt->execute(['rfq_id' => $rfqId]);
        return array_map([$this, 'mapBid'], $stmt->fetchAll());
    }

    private function nextRfqId(): string
    {
        $rows = $this->db->query("SELECT id FROM rfqs WHERE id LIKE 'RFQ-%'")->fetchAll();
        $max = 24000;
        foreach ($rows as $row) {
            if (preg_match('/RFQ-(\d+)/', $row['id'], $m)) {
                $max = max($max, (int) $m[1]);
            }
        }
        return 'RFQ-' . ($max + 1);
    }

    private function nextBidId(): string
    {
        $rows = $this->db->query("SELECT id FROM bids WHERE id LIKE 'BID-%'")->fetchAll();
        $max = 24000;
        foreach ($rows as $row) {
            if (preg_match('/BID-(\d+)/', $row['id'], $m)) {
                $max = max($max, (int) $m[1]);
            }
        }
        return 'BID-' . ($max + 1);
    }

    private function computeBidScore(array $bid, array $allBids): int
    {
        if ($allBids === []) {
            return 0;
        }

        $prices = array_map(fn ($item) => (float) $item['price'], $allBids);
        $minPrice = min($prices);
        $price = (float) $bid['price'];
        $priceScore = $price <= $minPrice ? 40 : max(8, (int) round(40 * ($minPrice / $price)));

        $deliveries = array_map(fn ($item) => $this->parseDeliveryDays($item['delivery']), $allBids);
        $minDelivery = min($deliveries);
        $bidDelivery = $this->parseDeliveryDays($bid['delivery']);
        $deliveryScore = $bidDelivery <= $minDelivery ? 30 : max(8, (int) round(30 * ($minDelivery / $bidDelivery)));

        $ratingScore = (int) round(((float) $bid['rating'] / 5) * 30);

        return min(100, $priceScore + $deliveryScore + $ratingScore);
    }

    private function parseDeliveryDays(string $delivery): int
    {
        return preg_match('/(\d+)/', $delivery, $m) ? (int) $m[1] : 30;
    }

    private function mapRfq(array $row): array
    {
        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'category' => $row['category'],
            'deadline' => $row['deadline'],
            'value' => (float) $row['value'],
            'description' => $row['description'] ?? '',
            'status' => $row['status'],
            'bids' => (int) ($row['bids'] ?? 0),
            'awardedSupplier' => $row['awarded_supplier'],
            'awardedBidId' => $row['awarded_bid_id'],
            'awardedAmount' => $row['awarded_amount'] !== null ? (float) $row['awarded_amount'] : null,
            'createdAt' => self::toIso($row['created_at'] ?? null),
        ];
    }

    private function mapBid(array $row): array
    {
        return [
            'id' => $row['id'],
            'rfqId' => $row['rfq_id'],
            'supplier' => $row['supplier'],
            'price' => (float) $row['price'],
            'delivery' => $row['delivery'],
            'warranty' => $row['warranty'],
            'rating' => (float) $row['rating'],
            'submittedAt' => self::toIso($row['submitted_at'] ?? null),
        ];
    }

    private static function toIso(?string $datetime): ?string
    {
        if ($datetime === null || $datetime === '') {
            return null;
        }

        try {
            return (new \DateTimeImmutable($datetime))->format('c');
        } catch (\Exception) {
            return $datetime;
        }
    }
}
