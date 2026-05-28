CREATE DATABASE srm_project;

USE srm_project;

CREATE TABLE users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100),
 email VARCHAR(100) UNIQUE,
 role ENUM('admin','supplier')
);