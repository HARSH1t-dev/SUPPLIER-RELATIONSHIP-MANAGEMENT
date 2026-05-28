<?php

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "srm_project";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$name = $_POST['name'];
$email = $_POST['email'];
$role = $_POST['role'];

$sql = "INSERT INTO users (name, email, role)
VALUES ('$name', '$email', '$role')";

if ($conn->query($sql) === TRUE) {

    if($role == "admin"){
        header("Location: admin.php");
    }

    else{
        header("Location: supplier.php");
    }

}

else{
    echo "Error: " . $conn->error;
}

$conn->close();

?>