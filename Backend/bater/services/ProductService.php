<?php
//constants max size  - size - upload directory
//validate product
// 
// create product
//Update product
// get product by

//helper
//validate product
//handle image upload



class ProductService {

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIR = '/uploads/products';
const ALLOWED_TYPES = ['image/png', 'image/jpg', 'image/jpeg'];

private function validateProductData(array $data): array {
        if (empty($data['title'])) {
            return ['success' => false, 'error' => 'Product title is required.'];
        }

        if (strlen($data['title']) > 200) {
            return ['success' => false, 'error' => 'Title cannot exceed 200 characters.'];
        }

        if (empty($data['description'])) {
            return ['success' => false, 'error' => 'Product description is required.'];
        }

        if (!isset($data['price']) || (float) $data['price'] <= 0) {
            return ['success' => false, 'error' => 'Price must be greater than zero.'];
        }

        if (!isset($data['stock']) || (int) $data['stock'] < 0) {
            return ['success' => false, 'error' => 'Stock cannot be negative.'];
        }

        if (empty($data['category_id'])) {
            return ['success' => false, 'error' => 'Category is required.'];
        }

        if (!Category::findById((int) $data['category_id'])) {
            return ['success' => false, 'error' => 'Selected category does not exist.'];
        }

        return ['success' => true];
    }

    private function formatProduct(Product $product): array {
        $category = Category::findById($product->category_id);
        $seller = User::findById($product->seller_id);

        return [
            'id' => $product->id,
            'seller_id' => $product->seller_id,
            'seller_name' => $seller?->name ?? null,
            'category_id' => $product->category_id,
            'category_name' => $category?->name ?? null,
            'title' => $product->title,
            'description' => $product->description,
            'price' => $product->price,
            'stock' => $product->stock,
            'image_path' => $product->image_path,
            'status' => $product->status,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ];
    }


// create product takes a seller id  and product id

public function createProduct(int $seller_id, array $data, ?array $file = null): array {

$validate = $this->validateProductData($data);
if(!$validate['success']){
    return $validate; 

}

$ImagePath = null;

if ($file && $file['error'] != UPLOAD_ERR_NO_FILE) {

        $upload = $this->handleImageUpload($file);
        if(!$upload['success']){
            return $upload;
        }
        $ImagePath = $upload['data']['path'];
}
$Product = new Product();

$Product->seller_id = $seller_id;
$Product->category_id =(int) $data['category_id'];
$Product->title = trim($data['title']);
$Product->description = trim($data['description']);
$Product->price = (float) $data['price'];
$Product->stock = (int) $data['stock'];
$Product->status = Product::STATUS_ACTIVE;
$Product->image_path = $ImagePath;

if(!$Product->save()){
    return ['success' => false, 'error' => "Product Creation Failed"];
}

return ['success' => true, 'data' => ['product_id' => $Product->id]];




}

public function updateProduct(int $product_id, int $seller_id, array $data, ?array $file = null): array {
    $product = Product::findById($product_id);

    if (!$product || $product->seller_id !== $seller_id || $product->status === Product::STATUS_REMOVED) {
        return $this->failureResponse('Product Not Found');
    }

    $nextData = [
        'title' => $data['title'] ?? $product->title,
        'description' => $data['description'] ?? $product->description,
        'price' => $data['price'] ?? $product->price,
        'stock' => $data['stock'] ?? $product->stock,
        'category_id' => $data['category_id'] ?? $product->category_id,
    ];

    $validate = $this->validateProductData($nextData);
    if (!$validate['success']) {
        return $validate;
    }

    if ($file && ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        $upload = $this->handleImageUpload($file);
        if (!$upload['success']) {
            return $upload;
        }

        if ($product->image_path && file_exists($product->image_path)) {
            unlink($product->image_path);
        }

        $product->image_path = $upload['data']['path'];
    }

    $product->category_id = (int) $nextData['category_id'];
    $product->title = trim($nextData['title']);
    $product->description = trim($nextData['description']);
    $product->price = (float) $nextData['price'];
    $product->stock = (int) $nextData['stock'];

    if ($product->stock > 0 && $product->status === Product::STATUS_INACTIVE) {
        $product->status = Product::STATUS_ACTIVE;
    }

    if (!$product->save()) {
        return $this->failureResponse('Product update failed');
    }

    return $this->successResponse(['product_id' => $product->id]);
}

public function DeactivateProduct(int $product_id, int $seller_id): array {

$Product = Product::findById($product_id);

if(!$Product || $Product->seller_id != $seller_id){
    return ['success' => false, 'error' => 'Product Not Found'];

}

$Product->status = Product::STATUS_INACTIVE;

if(!$Product->save()){
    return ['success' => false, 'error' => 'Failed to Deactivate Product'];
}

return ['success' => true, 'data' => ['product_id' => $product_id]];



}

public function getProductById(int $id){
    $product = Product::findById($id);

    if(!$product || $product->status === Product::STATUS_REMOVED){
    return ['success' => false, 'error' => 'Product Not Found'];
    }

    return ['success' => true, 'data' => $this->formatProduct($product)];
}
public function getActiveProducts(): array{
    
    $data = Product::findActive();
    return $this->successResponse(array_map([$this, 'formatProduct'], $data));

}

public function successResponse(array $data): array{

    return['success' => true, 'data' => $data];
}

public function failureResponse(string $error): array{

    return['success' => false, 'error' => $error];
}
public function searchProducts(string $keyword): array{

if (strlen(trim($keyword)) < 2){

    $error = 'Enter more than two keywords';
    return $this->failureResponse($error);
}

$data = Product::search(trim($keyword));

return $this->successResponse(array_map([$this, 'formatProduct'], $data));

}

public function getProductsByCategory(int $categoryId): array{
    $data = Product::findByCategory($categoryId);
    return $this->successResponse(array_map([$this, 'formatProduct'], $data));

}

public function getSellerProducts(int $seller_id): array{
    $data = Product::findBy('seller_id', $seller_id);

    return $this->successResponse(array_map([$this, 'formatProduct'], $data));

}



public function handleImageUpload(array $file): array {
    if (empty($file) || !isset($file['error'])) {
        return $this->failureResponse('No image was uploaded.');
    }

    if ($file['error'] === UPLOAD_ERR_NO_FILE) {
        return $this->failureResponse('No image was selected.');
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        return $this->failureResponse('Image upload failed.');
    }

    if ($file['size'] > self::MAX_IMAGE_SIZE) {
        return $this->failureResponse('Image must be smaller than 5 MB.');
    }

    $mime = null;
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
    } elseif (function_exists('mime_content_type')) {
        $mime = mime_content_type($file['tmp_name']);
    }

    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!$mime) {
        // Fallback to extension when MIME type detection is unavailable.
        if (in_array($extension, ['png', 'jpg', 'jpeg'], true)) {
            $mime = $extension === 'png' ? 'image/png' : 'image/jpeg';
        } else {
            return $this->failureResponse('Could not detect image type. Please upload a PNG or JPEG file.');
        }
    }

    if (!in_array($mime, self::ALLOWED_TYPES, true)) {
        return $this->failureResponse('Image must be a PNG or JPEG file.');
    }

    $uploadDir = dirname(__DIR__, 2) . '/public' . self::UPLOAD_DIR;

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        return $this->failureResponse('Could not prepare upload directory.');
    }

    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ['png', 'jpg', 'jpeg'], true)) {
        $extension = $mime === 'image/png' ? 'png' : 'jpg';
    }

    $filename = 'product_' . uniqid('', true) . '.' . $extension;
    $destination = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        return $this->failureResponse('Could not save uploaded image.');
    }

    return $this->successResponse(['path' => self::UPLOAD_DIR . '/' . $filename]);
}











}







?>
