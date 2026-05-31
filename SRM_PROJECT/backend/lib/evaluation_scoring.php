<?php

declare(strict_types=1);

function scoring_get_weights(mysqli $connection): array
{
    $defaults = [
        'weight_price' => 40.0,
        'weight_rating' => 25.0,
        'weight_delivery' => 20.0,
        'weight_compliance' => 15.0,
    ];

    $result = $connection->query('SELECT weight_price, weight_rating, weight_delivery, weight_compliance FROM evaluation_scoring_weights WHERE id = 1 LIMIT 1');
    if (!$result || $result->num_rows === 0) {
        return $defaults;
    }

    $row = $result->fetch_assoc();
    return [
        'weight_price' => (float)$row['weight_price'],
        'weight_rating' => (float)$row['weight_rating'],
        'weight_delivery' => (float)$row['weight_delivery'],
        'weight_compliance' => (float)$row['weight_compliance'],
    ];
}

function scoring_parse_delivery_days(string $delivery): int
{
    if (preg_match('/(\d+)/', $delivery, $matches)) {
        return max(1, (int)$matches[1]);
    }
    return 30;
}

function scoring_parse_warranty_months(string $warranty): int
{
    if (preg_match('/(\d+)/', $warranty, $matches)) {
        $value = (int)$matches[1];
        if (stripos($warranty, 'year') !== false) {
            return $value * 12;
        }
        return max(1, $value);
    }
    return 12;
}

function scoring_compliance_for_supplier(mysqli $connection, int $supplierTableId): array
{
    $stmt = $connection->prepare(
        'SELECT status, expiry FROM compliance_documents WHERE supplier_id = ? ORDER BY expiry DESC'
    );
    $stmt->bind_param('i', $supplierTableId);
    $stmt->execute();
    $result = $stmt->get_result();

    $hasActive = false;
    $hasExpired = false;
    while ($row = $result->fetch_assoc()) {
        $status = strtolower((string)$row['status']);
        $expiry = strtotime((string)$row['expiry']);
        if ($status === 'active' && ($expiry === false || $expiry >= time())) {
            $hasActive = true;
        } else {
            $hasExpired = true;
        }
    }
    $stmt->close();

    if ($hasActive && !$hasExpired) {
        return ['status' => 'Compliant', 'score' => 100.0];
    }
    if ($hasActive && $hasExpired) {
        return ['status' => 'Partial', 'score' => 65.0];
    }
    if ($hasExpired) {
        return ['status' => 'Non-Compliant', 'score' => 25.0];
    }
    return ['status' => 'Unknown', 'score' => 50.0];
}

function scoring_normalize_inverse(float $value, float $min, float $max): float
{
    if ($max <= $min) {
        return 100.0;
    }
    $normalized = (($max - $value) / ($max - $min)) * 100;
    return max(0.0, min(100.0, $normalized));
}

function scoring_calculate_quote_score(
    array $quote,
    array $rfqQuotes,
    array $weights,
    float $complianceScore
): float
{
    $prices = array_map(static fn ($q) => (float)$q['grand_total'], $rfqQuotes);
    $deliveries = array_map(static fn ($q) => scoring_parse_delivery_days((string)$q['delivery']), $rfqQuotes);

    $minPrice = min($prices);
    $maxPrice = max($prices);
    $minDelivery = min($deliveries);
    $maxDelivery = max($deliveries);

    $priceScore = scoring_normalize_inverse((float)$quote['grand_total'], $minPrice, $maxPrice);
    $deliveryScore = scoring_normalize_inverse(
        scoring_parse_delivery_days((string)$quote['delivery']),
        (float)$minDelivery,
        (float)$maxDelivery
    );

    $rating = isset($quote['supplier_rating']) ? (float)$quote['supplier_rating'] : 0.0;
    $ratingScore = max(0.0, min(100.0, ($rating / 5.0) * 100));

    $totalWeight = $weights['weight_price'] + $weights['weight_rating'] + $weights['weight_delivery'] + $weights['weight_compliance'];
    if ($totalWeight <= 0) {
        $totalWeight = 100.0;
    }

    $weighted =
        ($priceScore * $weights['weight_price']) +
        ($ratingScore * $weights['weight_rating']) +
        ($deliveryScore * $weights['weight_delivery']) +
        ($complianceScore * $weights['weight_compliance']);

    return round($weighted / $totalWeight, 2);
}

function scoring_supplier_table_id(mysqli $connection, int $userId): ?int
{
    $stmt = $connection->prepare('SELECT supplier_id FROM suppliers WHERE user_id = ? LIMIT 1');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    return $row ? (int)$row['supplier_id'] : null;
}

function scoring_count_completed_orders(mysqli $connection, int $userId): int
{
    $stmt = $connection->prepare(
        "SELECT COUNT(*) AS total FROM purchase_orders WHERE supplier_id = ? AND status IN ('delivered', 'fulfilled')"
    );
    if (!$stmt) {
        return 0;
    }
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    return (int)($row['total'] ?? 0);
}
