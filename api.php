<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST');

// 1. Check if a file was actually uploaded
if (!isset($_FILES['json_file']) || $_FILES['json_file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["error" => "Please upload a valid JSON file."]);
    exit;
}

// 2. Read and decode the uploaded JSON file
$jsonContent = file_get_contents($_FILES['json_file']['tmp_name']);
$suppliers = json_decode($jsonContent, true);

// Check if JSON is valid
if ($suppliers === null) {
    echo json_encode(["error" => "Invalid JSON format. Please check your file."]);
    exit;
}

// 3. Establish Baselines (Find Min/Max for normalization)
$prices = array_column($suppliers, 'price');
$days = array_column($suppliers, 'delivery_days');

$minPrice = min($prices);
$maxPrice = max($prices);
$minDays = min($days);
$maxDays = max($days);
$maxRating = 5.0; // Assuming a 5-star scale

// 4. Define Weights (Must sum to 1.0)
$wPrice = 0.40;   
$wRating = 0.40;  
$wDays = 0.20;    

// 5. Calculate Feasibility Score
foreach ($suppliers as &$s) {
    $normPrice = ($maxPrice == $minPrice) ? 1 : ($maxPrice - $s['price']) / ($maxPrice - $minPrice);
    $normDays = ($maxDays == $minDays) ? 1 : ($maxDays - $s['delivery_days']) / ($maxDays - $minDays);
    $normRating = $s['rating'] / $maxRating;

    $rawScore = ($normPrice * $wPrice) + ($normRating * $wRating) + ($normDays * $wDays);
    
    // Convert to out of 100 and force it to be a WHOLE NUMBER
    $s['feasibility_score'] = (int) round($rawScore * 100);
}

// 6. Sort array by Feasibility Score (Descending)
usort($suppliers, function($a, $b) {
    return $b['feasibility_score'] <=> $a['feasibility_score'];
});

// 7. Output sorted JSON
echo json_encode($suppliers);
?>