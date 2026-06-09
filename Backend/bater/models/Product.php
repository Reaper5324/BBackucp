<?php

class Product extends Model {

    protected static string $table = 'products';

    const STATUS_ACTIVE   = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_REMOVED  = 'removed';  // Set by Admin and cannot be reversed.

    public function __construct(
        public int     $seller_id    = 0,
        public int     $category_id  = 0,
        public string  $title        = '',
        public string  $description  = '',
        public float   $price        = 0.0,
        public int     $stock        = 0,
        public ?string $image_path   = null,
        public string  $status       = self::STATUS_ACTIVE,
        public ?string $created_at   = null,
        public ?string $updated_at   = null
    ) {}

    public static function findActive(): array {
        $db   = Database::getConnection();
        $stmt = $db->query("SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC");
        return array_map(fn($row) => static::fromRow($row), $stmt->fetchAll());
    }

    public static function search(string $keyword): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT * FROM products
             WHERE status = 'active'
               AND (title LIKE ? OR description LIKE ?)
             ORDER BY created_at DESC"
        );
        $term = '%' . $keyword . '%';
        $stmt->execute([$term, $term]);
        return array_map(fn($row) => static::fromRow($row), $stmt->fetchAll());
    }

    public static function findByCategory(int $categoryId): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT * FROM products WHERE category_id = ? AND status = 'active' ORDER BY created_at DESC"
        );
        $stmt->execute([$categoryId]);
        return array_map(fn($row) => static::fromRow($row), $stmt->fetchAll());
    }

    public function hasStock(int $quantity): bool {
        return $this->stock >= $quantity;
    }

    public function decrementStock(int $quantity): bool {
        if (!$this->hasStock($quantity)) return false;

        $this->stock -= $quantity;

        if ($this->stock === 0) {
            $this->status = self::STATUS_INACTIVE;
        }

        return $this->save();
    }

    public function restoreStock(int $quantity): bool {
        $this->stock += $quantity;
        $this->status = self::STATUS_ACTIVE;
        return $this->save();
    }

    public function getReviews(): array {
        return Review::findBy('product_id', $this->id);
    }

    public function getAverageRating(): float {
        $db   = Database::getConnection();
        $stmt = $db->prepare('SELECT AVG(rating) FROM reviews WHERE product_id = ?');
        $stmt->execute([$this->id]);
        return round((float) $stmt->fetchColumn(), 1);
    }

    public function getSeller(): ?User {
        return User::findById($this->seller_id);
    }

    public function getCategory(): ?Category {
        return Category::findById($this->category_id);
    }

    public static function fromRowPublic(array $row): static {
        return static::fromRow($row);
    }

    protected function toArray(): array {
        return [
            'seller_id'   => $this->seller_id,
            'category_id' => $this->category_id,
            'title'       => $this->title,
            'description' => $this->description,
            'price'       => $this->price,
            'stock'       => $this->stock,
            'image_path'  => $this->image_path,
            'status'      => $this->status,
        ];
    }

    protected static function fromRow(array $row): static {
        $p              = new static();
        $p->id          = (int)   $row['id'];
        $p->seller_id   = (int)   $row['seller_id'];
        $p->category_id = (int)   $row['category_id'];
        $p->title       =         $row['title'];
        $p->description =         $row['description'];
        $p->price       = (float) $row['price'];
        $p->stock       = (int)   $row['stock'];
        $p->image_path  =         $row['image_path'] ?? null;
        $p->status      =         $row['status'];
        $p->created_at  =         $row['created_at'] ?? null;
        $p->updated_at  =         $row['updated_at'] ?? null;
        return $p;
    }
}
