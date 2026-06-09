<?php 

class AuthService {

// Service methods return ['success' => true, 'data' => ...] or ['success' => false, 'error' => ...].
private function startSession(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

public function Register(array $data): array {
    //Check if all required fields have been filled
    $required = ['name', 'email', 'password', 'role'];

    foreach($required as $field){
        if(empty($data[$field])){
            return ['success' => false, 'error'=> "field '{$field}' is required"];
        }
    }
    
    if(!filter_var($data['email'], FILTER_VALIDATE_EMAIL)){
        return ['success' => false, 'error'=> "Invalid Email"];
    }
    
    if(strlen($data['password'])<8) {
        return ['success' => false, 'error'=> "Password Must Be Atleast 8 Charaters Long"];
    }
    if(User::findByEmail($data['email'])){
        return ['success' => false, 'error'=> "An Account with that email has been created"];
    }
    $allowedRoles = [Role::BUYER, Role::ADMIN, Role::SELLER];
    if (!in_array($data['role'], $allowedRoles)){
        return ['success' => false, 'error'=> "Invalid Role Selection"];

    }

    $role =Role::findOneBy('role_name', $data['role']);
    if (!$role){
        return ['success' => false, 'error'=> "Role Not Found"];
    }

    $user = new User();
    $user->name = trim($data['name']);
    $user->email =strtolower(trim($data['email']));
    $user->role_id = $role->id;
    $user->is_active = true;
    $user->phone = $data['phone'] ?? null; //optional
    $user->setPassword($data['password']); //bycrpt

    if(!$user->save()){
        return ['success' => false, 'error'=> "Registration Failed"];
    }

    return ['success' => true, 'data'=> ['user_id' => $user->id, 'role'=> $data['role']]];

    }

//Login  
public function login(string $email, string $password): array{
    if(empty($email) || empty($password)){
        return ['success' => false, 'error' => 'Fill in email and password'];

    }

    $user = User::findByEmail(strtolower(trim($email)));

    if (!$user || !$user->verifyPassword($password)){
        return ['success' => false, 'error' => 'Incorrect Email or Password'];
    }
    

    if(!$user->is_active){
        return['success' => false, 'error' => 'Your account is inactive or suspended. Contact support for further assistance'];

    }

    $this->startSession();
    $_SESSION['user_id'] = $user->id;
    $_SESSION['role'] = $user->getRole()->role_name;
    $_SESSION['logged_in'] = true;

    return [
        'success' => true, 
        'data' =>  [
        'user_id' => $user->id,
        'name' => $user->name,
        'role' => $_SESSION['role'],
        ],
    ];


    
}

public function logout(): void{
     
$this->startSession();
if(ini_get('session.use_cookies')){
    $params = session_get_cookie_params();
            setcookie(
                session_name(), '', time() - 42000,
                $params['path'], $params['domain'],
                $params['secure'], $params['httponly']
            );

        
}
session_destroy();  
    }

    public function isLoggedIn(): bool{
        $this->startSession();
        return !empty($_SESSION['logged_in']) && !empty($_SESSION['user_id']);
    }

    public function getCurrentUser(): ?User{
        if(!$this->isLoggedIn()){
            return null;
        }
        return User::findById($_SESSION['user_id']);
        }

     public function getCurrentRole(): ?string {
        $this->startSession();
        return $_SESSION['role'] ?? null;
    }




    }

   



    





    




?>
