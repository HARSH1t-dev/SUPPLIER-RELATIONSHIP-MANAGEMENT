<?php
require 'db.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get JSON payload from frontend
$data = json_decode(file_get_contents("php://input"));

// 1. Added isset($data->rating) to the condition
if(isset($data->item_id) && isset($data->bid_amount) && isset($data->user_id) && isset($data->rating)) {
    $itemId = $data->item_id;
    $bidAmount = $data->bid_amount;
    $userId = $data->user_id;
    $rating = $data->rating; // 2. Extracted the rating variable

    // Check if the bid is higher than the current bid
    $stmt = $pdo->prepare("SELECT current_bid FROM items WHERE id = ?");
    $stmt->execute([$itemId]);
    $item = $stmt->fetch();

    if($item && $bidAmount > $item['current_bid']) {
        // 3. Updated INSERT statement to include 'rating' and a 4th question mark
        $insertStmt = $pdo->prepare("INSERT INTO bids (item_id, user_id, bid_amount, rating) VALUES (?, ?, ?, ?)");
        
        // 4. Added $rating to the execution array
        $insertStmt->execute([$itemId, $userId, $bidAmount, $rating]);

        // Update the item's current bid
        $updateStmt = $pdo->prepare("UPDATE items SET current_bid = ? WHERE id = ?");
        $updateStmt->execute([$bidAmount, $itemId]);

        echo json_encode(["status" => "success", "message" => "Bid placed successfully!", "new_bid" => $bidAmount]);
    } else {
        echo json_encode(["status" => "error", "message" => "Bid must be higher than the current bid."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid data. Missing item, user, amount, or rating."]);
}
?>
