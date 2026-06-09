-- =============================================================================
-- Bater C2C Marketplace — Database Migration
-- Run this file once against a fresh MySQL database.
-- Tables are created in FK dependency order.
-- =============================================================================



-- -----------------------------------------------------------------------------
-- 1. roles
-- Referenced by: users
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id        INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(20)  NOT NULL UNIQUE   -- 'buyer', 'seller', 'admin'
) ENGINE=InnoDB;

INSERT INTO roles (role_name) VALUES ('buyer'), ('seller'), ('admin');

-- -----------------------------------------------------------------------------
-- 2. users
-- Referenced by: products, orders (x2), reviews, messages (x2),
--               notifications, seller_verifications, admin_logs (x3)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id              INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role_id         INT           UNSIGNED NOT NULL,
    profile_picture VARCHAR(255)  DEFAULT NULL,
    phone           VARCHAR(20)   DEFAULT NULL,
    address         TEXT          DEFAULT NULL,
    is_active       TINYINT(1)    NOT NULL DEFAULT 1,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. categories
-- Referenced by: products
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL UNIQUE,
    description TEXT         DEFAULT NULL
) ENGINE=InnoDB;

-- Seed some township-relevant categories
INSERT INTO categories (name) VALUES
    ('Clothing & Accessories'),
    ('Electronics'),
    ('Food & Beverages'),
    ('Home & Garden'),
    ('Health & Beauty'),
    ('Toys & Games'),
    ('Books & Media'),
    ('Other');

-- -----------------------------------------------------------------------------
-- 4. products
-- Referenced by: order_items, reviews, messages, cart
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    id          INT            UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    seller_id   INT            UNSIGNED NOT NULL,
    category_id INT            UNSIGNED NOT NULL,
    title       VARCHAR(200)   NOT NULL,
    description TEXT           NOT NULL,
    price       DECIMAL(10,2)  NOT NULL,
    stock       INT            UNSIGNED NOT NULL DEFAULT 0,
    image_path  VARCHAR(255)   DEFAULT NULL,
    status      ENUM('active','inactive','removed') NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_seller   FOREIGN KEY (seller_id)   REFERENCES users(id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),

    INDEX idx_products_status      (status),
    INDEX idx_products_category    (category_id),
    INDEX idx_products_seller      (seller_id),
    FULLTEXT INDEX ft_products_search (title, description)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. orders
-- Referenced by: order_items, payments
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id           INT            UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    buyer_id     INT            UNSIGNED NOT NULL,
    seller_id    INT            UNSIGNED NOT NULL,
    total_amount DECIMAL(10,2)  NOT NULL,
    status       ENUM('pending','paid','dispatched','delivered','completed','cancelled')
                                NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_buyer  FOREIGN KEY (buyer_id)  REFERENCES users(id),
    CONSTRAINT fk_orders_seller FOREIGN KEY (seller_id) REFERENCES users(id),

    INDEX idx_orders_buyer  (buyer_id),
    INDEX idx_orders_seller (seller_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. order_items
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
    id          INT            UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id    INT            UNSIGNED NOT NULL,
    product_id  INT            UNSIGNED NOT NULL,
    quantity    INT            UNSIGNED NOT NULL,
    unit_price  DECIMAL(10,2)  NOT NULL,   -- price at time of purchase

    CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id),

    INDEX idx_items_order (order_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 7. payments
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id             INT            UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id       INT            UNSIGNED NOT NULL UNIQUE,
    pf_payment_id  VARCHAR(255)   DEFAULT NULL,   -- PayFast's pf_payment_id from ITN
    pf_data        TEXT           DEFAULT NULL,    -- JSON of fields sent to PayFast
    amount         DECIMAL(10,2)  NOT NULL,
    status         ENUM('pending','completed','failed','refunded')
                                  NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id),

    INDEX idx_payments_pf (pf_payment_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 8. cart
-- -----------------------------------------------------------------------------
CREATE TABLE cart (
    id          INT  UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    buyer_id    INT  UNSIGNED NOT NULL,
    product_id  INT  UNSIGNED NOT NULL,
    quantity    INT  UNSIGNED NOT NULL DEFAULT 1,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_buyer   FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

    UNIQUE KEY uq_cart_item (buyer_id, product_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 9. reviews
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
    id           INT       UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reviewer_id  INT       UNSIGNED NOT NULL,
    product_id   INT       UNSIGNED NOT NULL,
    rating       TINYINT   UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT      NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id),
    CONSTRAINT fk_reviews_product  FOREIGN KEY (product_id)  REFERENCES products(id) ON DELETE CASCADE,

    UNIQUE KEY uq_one_review_per_buyer (reviewer_id, product_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 10. messages
-- -----------------------------------------------------------------------------
CREATE TABLE messages (
    id           INT       UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id    INT       UNSIGNED NOT NULL,
    receiver_id  INT       UNSIGNED NOT NULL,
    product_id   INT       UNSIGNED NOT NULL,
    body         TEXT      NOT NULL,
    is_read      TINYINT(1) NOT NULL DEFAULT 0,
    sent_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_msg_sender   FOREIGN KEY (sender_id)   REFERENCES users(id),
    CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id) REFERENCES users(id),
    CONSTRAINT fk_msg_product  FOREIGN KEY (product_id)  REFERENCES products(id),

    INDEX idx_msg_thread (product_id, sender_id, receiver_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 11. notifications
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id         INT       UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT       UNSIGNED NOT NULL,
    message    TEXT      NOT NULL,
    type       ENUM('order','payment','review','system') NOT NULL DEFAULT 'system',
    is_read    TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_notif_user_unread (user_id, is_read)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 12. seller_verifications
-- -----------------------------------------------------------------------------
CREATE TABLE seller_verifications (
    id          INT       UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    seller_id   INT       UNSIGNED NOT NULL UNIQUE,
    doc_type    VARCHAR(50) NOT NULL,
    doc_path    VARCHAR(255) NOT NULL,
    status      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    reviewed_by INT       UNSIGNED DEFAULT NULL,
    reviewed_at TIMESTAMP DEFAULT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_verif_seller   FOREIGN KEY (seller_id)   REFERENCES users(id),
    CONSTRAINT fk_verif_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 13. admin_logs
-- -----------------------------------------------------------------------------
CREATE TABLE admin_logs (
    id                INT       UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id          INT       UNSIGNED NOT NULL,
    action            VARCHAR(80) NOT NULL,
    target_user_id    INT       UNSIGNED DEFAULT NULL,
    target_product_id INT       UNSIGNED DEFAULT NULL,
    notes             TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_log_admin          FOREIGN KEY (admin_id)          REFERENCES users(id),
    CONSTRAINT fk_log_target_user    FOREIGN KEY (target_user_id)    REFERENCES users(id),
    CONSTRAINT fk_log_target_product FOREIGN KEY (target_product_id) REFERENCES products(id),

    INDEX idx_log_admin  (admin_id),
    INDEX idx_log_action (action)
) ENGINE=InnoDB;
