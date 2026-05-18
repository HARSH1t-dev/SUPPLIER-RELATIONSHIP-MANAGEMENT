<!DOCTYPE html>
<html>
<head>
    <title>SRM Login</title>

    <style>
        body{
            font-family: Arial;
            background: linear-gradient(to right, #4facfe, #00f2fe);
            height:100vh;
            display:flex;
            justify-content:center;
            align-items:center;
        }

        .container{
            background:white;
            padding:30px;
            width:350px;
            border-radius:10px;
            box-shadow:0px 0px 10px rgba(0,0,0,0.3);
        }

        h2{
            text-align:center;
            margin-bottom:20px;
        }

        input, select{
            width:100%;
            padding:10px;
            margin-top:10px;
            border:1px solid #ccc;
            border-radius:5px;
        }

        button{
            width:100%;
            padding:10px;
            margin-top:20px;
            border:none;
            background:#007BFF;
            color:white;
            font-size:16px;
            border-radius:5px;
            cursor:pointer;
        }

        button:hover{
            background:#0056b3;
        }
    </style>
</head>

<body>

<div class="container">

    <h2>SRM Login</h2>

    <form action="save.php" method="POST">

        <input type="text" name="name" placeholder="Enter Name" required>

        <input type="email" name="email" placeholder="Enter Email" required>

        <select name="role" required>
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="supplier">Supplier</option>
        </select>

        <button type="submit">Login</button>

    </form>

</div>

</body>
</html>