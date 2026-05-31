<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';
$connection = db_connection();
$method = $_SERVER['REQUEST_METHOD'];

// GET Requests
if ($method === 'GET') {
    $supplierId = isset($_GET['supplier_id']) ? (int) $_GET['supplier_id'] : null;
    $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : null;

    if ($userId !== null && $supplierId === null) {
        $stmt = $connection->prepare('SELECT supplier_id FROM suppliers WHERE user_id = ?');
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();
        $stmt->close();
        if ($row) {
            $supplierId = (int) $row['supplier_id'];
        }
    }

    if ($supplierId !== null) {
        // Fetch detailed info for a single supplier
        $stmt = $connection->prepare('
            SELECT s.*, u.full_name as contact_person, u.email as contact_email
            FROM suppliers s
            JOIN users u ON s.user_id = u.id
            WHERE s.supplier_id = ?
        ');
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        $supplierRes = $stmt->get_result();
        $supplier = $supplierRes->fetch_assoc();
        $stmt->close();

        if (!$supplier) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Supplier not found.']);
            exit;
        }

        // Fetch supplier reviews
        $stmt = $connection->prepare('
            SELECT r.*, u.full_name as reviewer_name
            FROM supplier_reviews r
            LEFT JOIN users u ON r.reviewed_by = u.id
            WHERE r.supplier_id = ?
            ORDER BY r.reviewed_at DESC
        ');
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        $reviewsRes = $stmt->get_result();
        $reviews = [];
        while ($row = $reviewsRes->fetch_assoc()) {
            $row['review_id'] = (int) $row['review_id'];
            $row['supplier_id'] = (int) $row['supplier_id'];
            $row['po_id'] = $row['po_id'] !== null ? (int) $row['po_id'] : null;
            $row['rating'] = (int) $row['rating'];
            $row['rating_quality'] = (int) $row['rating_quality'];
            $row['rating_price'] = (int) $row['rating_price'];
            $row['rating_delivery'] = (int) $row['rating_delivery'];
            $reviews[] = $row;
        }
        $stmt->close();

        // Fetch supplier's purchase orders
        $stmt = $connection->prepare('
            SELECT po_id, po_number, status, issued_date
            FROM purchase_orders
            WHERE supplier_quote_id IN (
                SELECT id FROM supplier_quotes WHERE supplier_id = ?
            )
        ');
        $stmt->bind_param('i', $supplier['user_id']);
        $stmt->execute();
        $poRes = $stmt->get_result();
        $pos = [];
        while ($row = $poRes->fetch_assoc()) {
            $row['po_id'] = (int) $row['po_id'];
            $pos[] = $row;
        }
        $stmt->close();

        // Calculate average metrics
        $stmt = $connection->prepare('
            SELECT 
                COALESCE(AVG(rating_quality), 5.0) as avg_quality,
                COALESCE(AVG(rating_price), 5.0) as avg_price,
                COALESCE(AVG(rating_delivery), 5.0) as avg_delivery,
                COUNT(review_id) as review_count
            FROM supplier_reviews
            WHERE supplier_id = ?
        ');
        $stmt->bind_param('i', $supplierId);
        $stmt->execute();
        $stats = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        // Calculate feasibility score based on constant weights (40% Quality, 40% Price, 20% Delivery)
        $avgQuality = (float) $stats['avg_quality'];
        $avgPrice = (float) $stats['avg_price'];
        $avgDelivery = (float) $stats['avg_delivery'];
        
        $feasibilityScore = (($avgQuality / 5.0) * 0.40 + ($avgPrice / 5.0) * 0.40 + ($avgDelivery / 5.0) * 0.20) * 100;

        echo json_encode([
            'success' => true,
            'supplier' => [
                'supplier_id' => (int) $supplier['supplier_id'],
                'user_id' => (int) $supplier['user_id'],
                'company_name' => $supplier['company_name'],
                'category' => $supplier['category'],
                'region' => $supplier['region'],
                'gst_number' => $supplier['gst_number'],
                'address' => $supplier['address'],
                'city' => $supplier['city'],
                'state' => $supplier['state'],
                'country' => $supplier['country'],
                'website' => $supplier['website'],
                'rating' => (float) $supplier['rating'],
                'contact_person' => $supplier['contact_person'],
                'contact_email' => $supplier['contact_email'],
                'avg_quality' => round($avgQuality, 1),
                'avg_price' => round($avgPrice, 1),
                'avg_delivery' => round($avgDelivery, 1),
                'review_count' => (int) $stats['review_count'],
                'feasibility_score' => (int) round($feasibilityScore)
            ],
            'reviews' => $reviews,
            'purchase_orders' => $pos
        ]);
        exit;
    } else {
        // Fetch all suppliers and calculate feasibility scores
        $sql = '
            SELECT 
                s.supplier_id,
                s.company_name,
                s.category,
                s.region,
                s.rating,
                COUNT(r.review_id) as review_count,
                COALESCE(AVG(r.rating_quality), 5.0) as avg_quality,
                COALESCE(AVG(r.rating_price), 5.0) as avg_price,
                COALESCE(AVG(r.rating_delivery), 5.0) as avg_delivery
            FROM suppliers s
            LEFT JOIN supplier_reviews r ON s.supplier_id = r.supplier_id
            GROUP BY s.supplier_id
        ';
        $result = $connection->query($sql);
        $suppliers = [];

        while ($row = $result->fetch_assoc()) {
            $avgQuality = (float) $row['avg_quality'];
            $avgPrice = (float) $row['avg_price'];
            $avgDelivery = (float) $row['avg_delivery'];

            // Calculate feasibility score based on constant weights (40% Quality, 40% Price, 20% Delivery)
            $feasibilityScore = (($avgQuality / 5.0) * 0.40 + ($avgPrice / 5.0) * 0.40 + ($avgDelivery / 5.0) * 0.20) * 100;

            $suppliers[] = [
                'supplier_id' => (int) $row['supplier_id'],
                'name' => $row['company_name'],
                'category' => $row['category'] ?: 'Mechanical',
                'region' => $row['region'] ?: 'North America',
                'rating' => (float) $row['rating'],
                'review_count' => (int) $row['review_count'],
                'avg_quality' => round($avgQuality, 1),
                'avg_price' => round($avgPrice, 1),
                'avg_delivery' => round($avgDelivery, 1),
                'feasibility_score' => (int) round($feasibilityScore)
            ];
        }

        // Sort by feasibility score descending
        usort($suppliers, function($a, $b) {
            return $b['feasibility_score'] <=> $a['feasibility_score'];
        });

        echo json_encode([
            'success' => true,
            'suppliers' => $suppliers
        ]);
        exit;
    }
}

// POST Requests (Submit Review)
if ($method === 'POST') {
    // Read input (support both form data and json payload)
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input === null) {
        $input = $_POST;
    }

    $supplierId = isset($input['supplier_id']) ? (int) $input['supplier_id'] : null;
    $poId = isset($input['po_id']) && $input['po_id'] !== '' ? (int) $input['po_id'] : null;
    $reviewText = isset($input['review']) ? trim((string) $input['review']) : '';
    $reviewedBy = isset($input['reviewed_by']) ? (int) $input['reviewed_by'] : 1; // Default to admin user id 1
    
    $ratingQuality = isset($input['rating_quality']) ? (int) $input['rating_quality'] : 5;
    $ratingPrice = isset($input['rating_price']) ? (int) $input['rating_price'] : 5;
    $ratingDelivery = isset($input['rating_delivery']) ? (int) $input['rating_delivery'] : 5;

    // Validate inputs
    if ($supplierId === null) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Supplier ID is required.']);
        exit;
    }

    // Check if supplier exists
    $stmt = $connection->prepare('SELECT supplier_id FROM suppliers WHERE supplier_id = ?');
    $stmt->bind_param('i', $supplierId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Supplier not found.']);
        $stmt->close();
        exit;
    }
    $stmt->close();

    // Verify rating ranges
    $ratingQuality = max(1, min(5, $ratingQuality));
    $ratingPrice = max(1, min(5, $ratingPrice));
    $ratingDelivery = max(1, min(5, $ratingDelivery));

    // Calculate composite review rating (1-5 stars)
    $overallRating = (int) round(($ratingQuality + $ratingPrice + $ratingDelivery) / 3);

    // Insert review
    $stmt = $connection->prepare('
        INSERT INTO supplier_reviews (supplier_id, po_id, rating, review, reviewed_by, rating_quality, rating_price, rating_delivery)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->bind_param('iiisiiii', $supplierId, $poId, $overallRating, $reviewText, $reviewedBy, $ratingQuality, $ratingPrice, $ratingDelivery);

    if ($stmt->execute()) {
        // Update the average rating in suppliers table
        $updateStmt = $connection->prepare('
            UPDATE suppliers 
            SET rating = (
                SELECT COALESCE(AVG(rating), 0.0) 
                FROM supplier_reviews 
                WHERE supplier_id = ?
            )
            WHERE supplier_id = ?
        ');
        $updateStmt->bind_param('ii', $supplierId, $supplierId);
        $updateStmt->execute();
        $updateStmt->close();

        echo json_encode([
            'success' => true,
            'message' => 'Review submitted successfully.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save review: ' . $stmt->error
        ]);
    }
    $stmt->close();
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
