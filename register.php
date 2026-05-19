<?php

include 'db.php';

if(isset($_POST['name'])){

$name = $_POST['name'];
$email = $_POST['email'];
$password = $_POST['password'];

$sql = "INSERT INTO users(name,email,password)
VALUES('$name','$email','$password')";

if(mysqli_query($conn,$sql)){
    echo "Registration Successful";
}else{
    echo "Error";
}

}

?>

<form method="POST">

<input type="text" name="name"
placeholder="Name">

<br><br>

<input type="email" name="email"
placeholder="Email">

<br><br>

<input type="password" name="password"
placeholder="Password">

<br><br>

<button type="submit">
Register
</button>

</form>