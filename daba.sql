-- Create a table for the items being auctioned
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    starting_price DECIMAL(10, 2) NOT NULL,
    current_bid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    end_time DATETIME NOT NULL
);

-- Create a table for the bids
CREATE TABLE bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    user_id INT NOT NULL, 
    bid_amount DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(3, 1) DEFAULT 0.0, -- New rating column added here
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id)
);
