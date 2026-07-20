import os
from decimal import Decimal
from typing import Any

import pymysql
import requests
from dotenv import load_dotenv

load_dotenv()


def _clean(value: Any, default: str = "Not specified") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def _money(value: Any) -> str:
    try:
        amount = Decimal(str(value))
    except Exception:
        return _clean(value)
    return f"R{amount:.2f}"


def product_to_document(product: dict) -> tuple[str, dict]:
    product_id = product.get("id")
    title = _clean(product.get("title"), "Untitled product")
    category = _clean(product.get("category_name"))
    seller = _clean(product.get("seller_name"), "Marketplace seller")
    status = _clean(product.get("status"))
    stock = _clean(product.get("stock"), "0")
    price = _money(product.get("price"))
    description = _clean(product.get("description"), "No description provided")

    text = "\n".join([
        f"Product ID: {product_id}",
        f"Product title: {title}",
        f"Category: {category}",
        f"Seller: {seller}",
        f"Price: {price}",
        f"Stock available: {stock}",
        f"Status: {status}",
        f"Description: {description}",
        f"Product page: #/products/{product_id}",
    ])

    metadata = {
        "doc_type": "product",
        "source": f"Product #{product_id}: {title}",
        "page": "",
        "product_id": str(product_id),
        "title": title,
        "category": category,
        "seller": seller,
        "price": price,
        "stock": str(stock),
        "status": status,
        "url": f"#/products/{product_id}",
    }

    return text, metadata


def fetch_products_from_api() -> list[dict]:
    base_url = os.getenv("PRODUCT_API_URL") or os.getenv("BACKEND_API_URL") or os.getenv("API_URL")
    if not base_url:
        return []

    url = base_url.rstrip("/") + "/products"
    response = requests.get(url, timeout=20)
    response.raise_for_status()
    payload = response.json()

    if isinstance(payload, dict):
        products = payload.get("data", [])
    else:
        products = payload

    if not isinstance(products, list):
        raise ValueError("Product API did not return a product list")

    return [product for product in products if isinstance(product, dict)]


def fetch_products_from_db() -> list[dict]:
    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")
    if not db_name or not db_user:
        return []

    connection = pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=db_user,
        password=os.getenv("DB_PASS", ""),
        database=db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )

    query = """
        SELECT
            p.id,
            p.seller_id,
            u.name AS seller_name,
            p.category_id,
            c.name AS category_name,
            p.title,
            p.description,
            p.price,
            p.stock,
            p.image_path,
            p.status,
            p.created_at,
            p.updated_at
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN users u ON u.id = p.seller_id
        WHERE p.status = 'active'
        ORDER BY p.updated_at DESC, p.created_at DESC
    """

    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            return list(cursor.fetchall())
    finally:
        connection.close()


def fetch_products() -> list[dict]:
    try:
        products = fetch_products_from_api()
        if products:
            return products
    except requests.RequestException as exc:
        print(f"Product API unavailable, falling back to database: {exc}")

    return fetch_products_from_db()
