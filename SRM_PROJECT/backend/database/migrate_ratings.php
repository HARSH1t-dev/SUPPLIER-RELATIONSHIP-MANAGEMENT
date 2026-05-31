<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$connection = db_connection();

echo "Running supplier ratings database migrations...\n";

// 1. Modify supplier_reviews table to make po_id nullable
if ($connection->query("ALTER TABLE supplier_reviews MODIFY po_id INT NULL")) {
    echo "Modified po_id to be nullable in supplier_reviews table.\n";
} else {
    echo "Error modifying po_id column: " . $connection->error . "\n";
}

// 2. Add category and region columns to suppliers table if they don't exist
$supplierCols = [
    'category' => "ALTER TABLE suppliers ADD COLUMN category VARCHAR(100) DEFAULT NULL",
    'region' => "ALTER TABLE suppliers ADD COLUMN region VARCHAR(100) DEFAULT NULL"
];

foreach ($supplierCols as $colName => $sql) {
    $result = $connection->query("SHOW COLUMNS FROM suppliers LIKE '$colName'");
    if ($result->num_rows === 0) {
        if ($connection->query($sql)) {
            echo "Successfully added $colName column to suppliers table.\n";
        } else {
            echo "Failed to add $colName column: " . $connection->error . "\n";
        }
    } else {
        echo "$colName column already exists in suppliers table.\n";
    }
}

// 3. Add rating_quality, rating_price, rating_delivery columns to supplier_reviews if they don't exist
$reviewCols = [
    'rating_quality' => "ALTER TABLE supplier_reviews ADD COLUMN rating_quality INT DEFAULT 5 CHECK (rating_quality BETWEEN 1 AND 5)",
    'rating_price' => "ALTER TABLE supplier_reviews ADD COLUMN rating_price INT DEFAULT 5 CHECK (rating_price BETWEEN 1 AND 5)",
    'rating_delivery' => "ALTER TABLE supplier_reviews ADD COLUMN rating_delivery INT DEFAULT 5 CHECK (rating_delivery BETWEEN 1 AND 5)"
];

foreach ($reviewCols as $colName => $sql) {
    $result = $connection->query("SHOW COLUMNS FROM supplier_reviews LIKE '$colName'");
    if ($result->num_rows === 0) {
        if ($connection->query($sql)) {
            echo "Successfully added $colName column to supplier_reviews table.\n";
        } else {
            echo "Failed to add $colName column: " . $connection->error . "\n";
        }
    } else {
        echo "$colName column already exists in supplier_reviews table.\n";
    }
}

// 4. Seed all 16 mock suppliers and user accounts
$mockSuppliers = [
    ['email' => 'apex@srm.local', 'name' => 'Maya Chen', 'company' => 'Apex Industrial Components', 'category' => 'Mechanical', 'region' => 'North America'],
    ['email' => 'vector@srm.local', 'name' => 'Elias Romero', 'company' => 'Vector Packaging Co.', 'category' => 'Packaging', 'region' => 'Europe'],
    ['email' => 'northstar@srm.local', 'name' => 'Priya Nair', 'company' => 'Northstar Logistics', 'category' => 'Logistics', 'region' => 'APAC'],
    ['email' => 'helio@srm.local', 'name' => 'Jonas Weber', 'company' => 'Helio Energy Systems', 'category' => 'Facilities & Maintenance', 'region' => 'Middle East'],
    ['email' => 'summit@srm.local', 'name' => 'Olivia Grant', 'company' => 'Summit Precision Tools', 'category' => 'Mechanical', 'region' => 'North America'],
    ['email' => 'blueriver@srm.local', 'name' => 'Kenji Sato', 'company' => 'BlueRiver Electronics', 'category' => 'Electrical', 'region' => 'APAC'],
    ['email' => 'greenline@srm.local', 'name' => 'Nora Klein', 'company' => 'Greenline Facility Services', 'category' => 'Facilities & Maintenance', 'region' => 'Europe'],
    ['email' => 'metro@srm.local', 'name' => 'Diego Alvarez', 'company' => 'Metro Freight Partners', 'category' => 'Logistics', 'region' => 'North America'],
    ['email' => 'prime@srm.local', 'name' => 'Anika Rao', 'company' => 'Prime Polymer Works', 'category' => 'Chemical & Raw Materials', 'region' => 'APAC'],
    ['email' => 'cobalt@srm.local', 'name' => 'Marc Dubois', 'company' => 'Cobalt Safety Systems', 'category' => 'Facilities & Maintenance', 'region' => 'Europe'],
    ['email' => 'orion@srm.local', 'name' => 'Samir Haddad', 'company' => 'Orion Maintenance Group', 'category' => 'IT & Professional Services', 'region' => 'Middle East'],
    ['email' => 'silverline@srm.local', 'name' => 'Mei Lin', 'company' => 'Silverline Packaging', 'category' => 'Packaging', 'region' => 'APAC'],
    ['email' => 'atlas@srm.local', 'name' => 'Harper Cole', 'company' => 'Atlas Industrial Pumps', 'category' => 'Mechanical', 'region' => 'North America'],
    ['email' => 'nova@srm.local', 'name' => 'Elena Rossi', 'company' => 'Nova Cleanroom Supply', 'category' => 'Facilities & Maintenance', 'region' => 'Europe'],
    ['email' => 'rapidroute@srm.local', 'name' => 'Arjun Menon', 'company' => 'RapidRoute Carriers', 'category' => 'Logistics', 'region' => 'APAC'],
    ['email' => 'vertex@srm.local', 'name' => 'Leah Stone', 'company' => 'Vertex Energy Controls', 'category' => 'Facilities & Maintenance', 'region' => 'Middle East']
];

foreach ($mockSuppliers as $sup) {
    // Check if user exists
    $stmt = $connection->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $sup['email']);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) {
        $pHash = password_hash('password123', PASSWORD_DEFAULT);
        $role = 'supplier';
        $stmt2 = $connection->prepare("INSERT INTO users (full_name, email, role, password_hash, company_name) VALUES (?, ?, ?, ?, ?)");
        $stmt2->bind_param("sssss", $sup['name'], $sup['email'], $role, $pHash, $sup['company']);
        $stmt2->execute();
        $userId = $stmt2->insert_id;
        $stmt2->close();
    } else {
        $userId = (int) $res->fetch_assoc()['id'];
    }
    $stmt->close();

    // Check if supplier exists
    $stmt = $connection->prepare("SELECT supplier_id FROM suppliers WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) {
        $stmt2 = $connection->prepare("INSERT INTO suppliers (user_id, company_name, category, region) VALUES (?, ?, ?, ?)");
        $stmt2->bind_param("isss", $userId, $sup['company'], $sup['category'], $sup['region']);
        $stmt2->execute();
        $stmt2->close();
    } else {
        // Update category and region if they were added
        $stmt2 = $connection->prepare("UPDATE suppliers SET category = ?, region = ? WHERE user_id = ?");
        $stmt2->bind_param("ssi", $sup['category'], $sup['region'], $userId);
        $stmt2->execute();
        $stmt2->close();
    }
    $stmt->close();
}

// 5. Seed some initial reviews for suppliers to make it realistic
$result = $connection->query("SELECT supplier_id FROM suppliers");
$supplierIds = [];
while ($row = $result->fetch_assoc()) {
    $supplierIds[] = (int) $row['supplier_id'];
}

$sampleComments = [
    "Excellent supplier, met all our quality and delivery speed requirements perfectly.",
    "Very cost-effective but delivery was slightly delayed. Good overall communication.",
    "Quality of deliverables was average. We had to ask for double verification on several items.",
    "Outstanding performance! Will definitely partner with them for future purchase orders.",
    "Price was a bit high compared to competitors, but the delivery speed and support was exceptional."
];

foreach ($supplierIds as $sId) {
    // Check if reviews already exist
    $stmt = $connection->prepare("SELECT review_id FROM supplier_reviews WHERE supplier_id = ?");
    $stmt->bind_param("i", $sId);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) {
        // Seed 2 random reviews
        for ($i = 0; $i < 2; $i++) {
            $q = rand(3, 5);
            $p = rand(3, 5);
            $d = rand(3, 5);
            $overall = (int) round(($q + $p + $d) / 3);
            $comment = $sampleComments[rand(0, count($sampleComments) - 1)];
            
            $stmt2 = $connection->prepare("INSERT INTO supplier_reviews (supplier_id, po_id, rating, review, reviewed_by, rating_quality, rating_price, rating_delivery) VALUES (?, NULL, ?, ?, 1, ?, ?, ?)");
            $stmt2->bind_param("iisiii", $sId, $overall, $comment, $q, $p, $d);
            $stmt2->execute();
            $stmt2->close();
        }
    }
    $stmt->close();
}

echo "Database migrations and seeding completed successfully!\n";
?>
