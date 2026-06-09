<?php

/**
 * Category
 *
 * Organises products into browsable groups.
 *
 * Collaborators: Product
 */
class Category extends Model {

    protected static string $table = 'categories';

    public function __construct(
        public string  $name        = '',
        public ?string $description = null
    ) {}

    /**
     * Fetch all products belonging to this category.
     */
    public function getProducts(): array {
        return Product::findBy('category_id', $this->id);
    }

    protected function toArray(): array {
        return [
            'name'        => $this->name,
            'description' => $this->description,
        ];
    }

    protected static function fromRow(array $row): static {
        $cat              = new static();
        $cat->id          = (int) $row['id'];
        $cat->name        = $row['name'];
        $cat->description = $row['description'] ?? null;
        return $cat;
    }
}
?>