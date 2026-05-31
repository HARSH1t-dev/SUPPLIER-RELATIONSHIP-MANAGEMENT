<?php

declare(strict_types=1);

function demo_store_path(): string
{
    return __DIR__ . '/../data/demo_store.json';
}

function demo_seed_path(): string
{
    return __DIR__ . '/../data/demo_seed.json';
}

function demo_load_store(): array
{
    $path = demo_store_path();
    if (!is_file($path)) {
        $seed = file_get_contents(demo_seed_path());
        if ($seed === false) {
            return ['evaluations' => [], 'rfqs' => [], 'audit_logs' => [], 'suppliers_detail' => []];
        }
        file_put_contents($path, $seed);
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function demo_save_store(array $data): void
{
    $data['demo_mode'] = true;
    file_put_contents(demo_store_path(), json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function demo_reset_store(): array
{
    $seed = file_get_contents(demo_seed_path());
    if ($seed !== false) {
        file_put_contents(demo_store_path(), $seed);
    }
    return demo_load_store();
}

function demo_status_label(string $status): string
{
    return match ($status) {
        'shortlisted' => 'Shortlisted',
        'approved_for_bidding' => 'Approved',
        'rejected' => 'Rejected',
        default => 'Pending',
    };
}

function demo_compute_metrics(array $evaluations): array
{
    $counts = ['pending' => 0, 'shortlisted' => 0, 'approved_for_bidding' => 0, 'rejected' => 0];
    foreach ($evaluations as $row) {
        $status = $row['status'] ?? 'pending';
        if (isset($counts[$status])) {
            $counts[$status]++;
        }
    }
    $supplierIds = [];
    foreach ($evaluations as $row) {
        $supplierIds[$row['supplier_id']] = true;
    }

    return [
        'total_suppliers' => max(6, count($supplierIds) + 1),
        'pending_evaluation' => $counts['pending'],
        'shortlisted_suppliers' => $counts['shortlisted'],
        'approved_suppliers' => $counts['approved_for_bidding'],
        'rejected_suppliers' => $counts['rejected'],
    ];
}

function demo_filter_evaluations(array $evaluations, ?string $rfqId, ?string $status, ?string $search, string $sort): array
{
    $rows = $evaluations;
    if ($rfqId) {
        $rows = array_values(array_filter($rows, static fn ($r) => ($r['rfq_id'] ?? '') === $rfqId));
    }
    if ($status) {
        $rows = array_values(array_filter($rows, static fn ($r) => ($r['status'] ?? '') === $status));
    }
    if ($search) {
        $q = strtolower($search);
        $rows = array_values(array_filter($rows, static function ($r) use ($q) {
            return str_contains(strtolower($r['company_name'] ?? ''), $q)
                || str_contains(strtolower($r['supplier_name'] ?? ''), $q);
        }));
    }

    usort($rows, static function ($a, $b) use ($sort) {
        return match ($sort) {
            'price_asc' => ($a['bid_amount'] ?? 0) <=> ($b['bid_amount'] ?? 0),
            'rating_desc' => ($b['supplier_rating'] ?? 0) <=> ($a['supplier_rating'] ?? 0),
            default => ($b['score'] ?? 0) <=> ($a['score'] ?? 0),
        };
    });

    return $rows;
}

function demo_add_audit(array &$store, string $action, string $details, ?int $userId = null): void
{
    $id = (int)($store['next_audit_id'] ?? 1);
    array_unshift($store['audit_logs'], [
        'id' => $id,
        'time' => date('Y-m-d H:i:s'),
        'user' => 'Admin User',
        'action' => $action,
        'module' => 'Suppliers',
        'result' => 'Success',
        'details' => $details,
    ]);
    $store['next_audit_id'] = $id + 1;
    $store['audit_logs'] = array_slice($store['audit_logs'], 0, 100);
}

function demo_find_evaluation(array $store, int $evaluationId): ?array
{
    foreach ($store['evaluations'] as $idx => $row) {
        if ((int)($row['evaluation_id'] ?? 0) === $evaluationId) {
            return ['index' => $idx, 'row' => $row];
        }
    }
    return null;
}

function demo_handle_supplier_evaluations(): void
{
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if (isset($_GET['reset']) && $_GET['reset'] === '1') {
        $store = demo_reset_store();
        echo json_encode(['success' => true, 'message' => 'Demo data reset.', 'demo_mode' => true, 'metrics' => demo_compute_metrics($store['evaluations'] ?? [])]);
        exit;
    }

    $store = demo_load_store();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (isset($_GET['metrics']) && $_GET['metrics'] === '1') {
            echo json_encode([
                'success' => true,
                'demo_mode' => true,
                'metrics' => demo_compute_metrics($store['evaluations'] ?? []),
            ]);
            exit;
        }

        $supplierId = isset($_GET['supplier_id']) ? (int)$_GET['supplier_id'] : 0;
        if ($supplierId > 0 && isset($_GET['detail']) && $_GET['detail'] === '1') {
            $detail = $store['suppliers_detail'][(string)$supplierId] ?? null;
            if (!$detail) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Supplier not found in demo data.']);
                exit;
            }
            $history = array_values(array_filter(
                $store['evaluations'] ?? [],
                static fn ($e) => (int)($e['supplier_id'] ?? 0) === $supplierId
            ));
            foreach ($history as &$h) {
                $h['status_label'] = demo_status_label((string)$h['status']);
            }
            unset($h);
            $detail['evaluation_history'] = $history;
            $detail['past_rfqs'] = array_values(array_unique(array_map(static fn ($b) => $b['rfq_id'], $detail['past_bids'] ?? [])));
            echo json_encode(['success' => true, 'demo_mode' => true, 'supplier' => $detail]);
            exit;
        }

        $rfqId = isset($_GET['rfq_id']) ? trim((string)$_GET['rfq_id']) : '';
        $status = isset($_GET['status']) ? trim((string)$_GET['status']) : '';
        $sort = isset($_GET['sort']) ? trim((string)$_GET['sort']) : 'score_desc';
        $search = isset($_GET['search']) ? trim((string)$_GET['search']) : '';

        $evaluations = demo_filter_evaluations(
            $store['evaluations'] ?? [],
            $rfqId !== '' ? $rfqId : null,
            $status !== '' ? $status : null,
            $search !== '' ? $search : null,
            $sort
        );

        echo json_encode([
            'success' => true,
            'demo_mode' => true,
            'evaluations' => $evaluations,
            'metrics' => demo_compute_metrics($store['evaluations'] ?? []),
            'rfq_id' => $rfqId !== '' ? $rfqId : null,
        ]);
        exit;
    }

    if ($method === 'POST' || $method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $input = is_array($input) ? $input : [];
        $action = trim((string)($input['action'] ?? ''));

        if ($action === 'bulk_approve') {
            $rfqId = trim((string)($input['rfq_id'] ?? ''));
            $supplierIds = $input['supplier_ids'] ?? [];
            $approved = [];
            foreach ($store['evaluations'] as $idx => $row) {
                if (($row['rfq_id'] ?? '') === $rfqId && in_array((int)$row['supplier_id'], array_map('intval', $supplierIds), true)) {
                    $store['evaluations'][$idx]['status'] = 'approved_for_bidding';
                    $store['evaluations'][$idx]['status_label'] = 'Approved';
                    $approved[] = $row['company_name'];
                    demo_add_audit($store, 'SUPPLIER_APPROVED_FOR_BIDDING', ($row['company_name'] ?? 'Supplier') . ' approved for RFQ ' . $rfqId);
                }
            }
            demo_save_store($store);
            echo json_encode([
                'success' => true,
                'demo_mode' => true,
                'message' => count($approved) . ' supplier(s) approved for final bidding.',
                'approved' => $approved,
            ]);
            exit;
        }

        $evaluationId = (int)($input['evaluation_id'] ?? 0);
        $found = demo_find_evaluation($store, $evaluationId);
        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Evaluation not found.']);
            exit;
        }

        $idx = $found['index'];
        $row = $found['row'];

        if ($action === 'update_notes') {
            $store['evaluations'][$idx]['admin_notes'] = trim((string)($input['admin_notes'] ?? ''));
            demo_add_audit($store, 'SUPPLIER_EVALUATION_NOTES_UPDATED', 'Notes updated for ' . ($row['company_name'] ?? 'supplier'));
            demo_save_store($store);
            echo json_encode(['success' => true, 'demo_mode' => true, 'message' => 'Admin notes saved.']);
            exit;
        }

        $newStatus = match ($action) {
            'shortlist' => 'shortlisted',
            'approve_for_bidding', 'approve' => 'approved_for_bidding',
            'reject' => 'rejected',
            default => null,
        };

        if ($newStatus === null) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Unknown action.']);
            exit;
        }

        $store['evaluations'][$idx]['status'] = $newStatus;
        $store['evaluations'][$idx]['status_label'] = demo_status_label($newStatus);
        if (!empty($input['admin_notes'])) {
            $store['evaluations'][$idx]['admin_notes'] = trim((string)$input['admin_notes']);
        }

        $auditAction = match ($newStatus) {
            'shortlisted' => 'SUPPLIER_SHORTLISTED',
            'approved_for_bidding' => 'SUPPLIER_APPROVED_FOR_BIDDING',
            'rejected' => 'SUPPLIER_REJECTED',
            default => 'SUPPLIER_EVALUATION_UPDATED',
        };
        demo_add_audit($store, $auditAction, ($row['company_name'] ?? 'Supplier') . ' — ' . $newStatus . ' on ' . ($row['rfq_id'] ?? ''));
        demo_save_store($store);

        echo json_encode([
            'success' => true,
            'demo_mode' => true,
            'message' => 'Supplier evaluation updated.',
            'evaluation' => [
                'evaluation_id' => $evaluationId,
                'status' => $newStatus,
                'status_label' => demo_status_label($newStatus),
            ],
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
}

function demo_handle_rfq_comparison(): void
{
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');

    $rfqId = isset($_GET['rfq_id']) ? trim((string)$_GET['rfq_id']) : '';
    if ($rfqId === '') {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'rfq_id is required.']);
        exit;
    }

    $store = demo_load_store();
    $rows = demo_filter_evaluations($store['evaluations'] ?? [], $rfqId, null, null, 'price_asc');

    $comparison = [];
    $lowest = null;
    $highestRating = null;
    $bestScore = null;

    foreach ($rows as $row) {
        $entry = [
            'bid_id' => $row['bid_id'],
            'supplier_id' => $row['supplier_id'],
            'supplier_name' => $row['company_name'],
            'rating' => $row['supplier_rating'],
            'quotation_price' => $row['quotation_price'],
            'delivery_days' => $row['delivery_days'],
            'warranty_months' => $row['warranty_months'],
            'compliance_status' => $row['compliance_status'],
            'total_orders' => $row['total_orders_completed'],
            'score' => $row['score'],
        ];
        $comparison[] = $entry;

        if ($lowest === null || $entry['quotation_price'] < $lowest['quotation_price']) {
            $lowest = $entry;
        }
        if ($highestRating === null || $entry['rating'] > $highestRating['rating']) {
            $highestRating = $entry;
        }
        if ($bestScore === null || $entry['score'] > $bestScore['score']) {
            $bestScore = $entry;
        }
    }

    echo json_encode([
        'success' => true,
        'demo_mode' => true,
        'rfq_id' => $rfqId,
        'comparison' => $comparison,
        'highlights' => [
            'lowest_price_bid_id' => $lowest['bid_id'] ?? null,
            'highest_rating_bid_id' => $highestRating['bid_id'] ?? null,
            'best_overall_score_bid_id' => $bestScore['bid_id'] ?? null,
        ],
    ]);
}

function demo_handle_rfqs(): void
{
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');

    $store = demo_load_store();
    $rfqs = $store['rfqs'] ?? [];

    if (isset($_GET['id'])) {
        $id = trim((string)$_GET['id']);
        foreach ($rfqs as $rfq) {
            if (($rfq['id'] ?? '') === $id) {
                $rfq['items'] = [
                    ['id' => 1, 'item_name' => 'Business Laptop 14"', 'specification' => 'Intel i7, 16GB RAM', 'quantity' => 50, 'unit' => 'units'],
                ];
                echo json_encode(['success' => true, 'demo_mode' => true, 'rfq' => $rfq]);
                exit;
            }
        }
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'RFQ not found.']);
        exit;
    }

    echo json_encode(['success' => true, 'demo_mode' => true, 'rfqs' => $rfqs]);
}

function demo_handle_audit_logs(): void
{
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');

    $store = demo_load_store();
    echo json_encode(['success' => true, 'demo_mode' => true, 'logs' => $store['audit_logs'] ?? []]);
}
