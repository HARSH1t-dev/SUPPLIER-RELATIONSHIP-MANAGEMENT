<?php

/**
 * SRM Bidding System - Application Configuration
 *
 * Central configuration file. All environment-specific values
 * should be changed here or overridden via environment variables.
 *
 * @package    SRMBidding
 * @version    1.0.0
 */

declare(strict_types=1);

// ============================================================
// ENVIRONMENT DETECTION
// Set to 'development' locally, 'production' on live server.
// In production, set the APP_ENV environment variable instead
// of hardcoding it here.
// ============================================================
define('APP_ENV', getenv('APP_ENV') ?: 'development');

// ============================================================
// ERROR REPORTING
// Show detailed errors only in development mode.
// In production, all errors are silently logged.
// ============================================================
if (APP_ENV === 'development') {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
}

// ============================================================
// PATH CONSTANTS
// ============================================================
define('ROOT_PATH',    dirname(__DIR__));
define('CONFIG_PATH',  ROOT_PATH . DIRECTORY_SEPARATOR . 'config');
define('VIEWS_PATH',   ROOT_PATH . DIRECTORY_SEPARATOR . 'views');
define('MODELS_PATH',  ROOT_PATH . DIRECTORY_SEPARATOR . 'models');
define('CONTROLLERS_PATH', ROOT_PATH . DIRECTORY_SEPARATOR . 'controllers');
define('HELPERS_PATH', ROOT_PATH . DIRECTORY_SEPARATOR . 'helpers');
define('UPLOAD_PATH',  ROOT_PATH . DIRECTORY_SEPARATOR . 'uploads');
define('ASSETS_PATH',  ROOT_PATH . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'assets');
define('LOGS_PATH',    ROOT_PATH . DIRECTORY_SEPARATOR . 'logs');

// ============================================================
// DATABASE CONFIGURATION
// Override using environment variables for security in production.
// ============================================================
define('DB_HOST',    getenv('DB_HOST')    ?: 'localhost');
define('DB_PORT',    getenv('DB_PORT')    ?: '3306');
define('DB_NAME',    getenv('DB_NAME')    ?: 'srm_bidding');
define('DB_USER',    getenv('DB_USER')    ?: 'root');
define('DB_PASS',    getenv('DB_PASS')    ?: '');
define('DB_CHARSET', 'utf8mb4');

// ============================================================
// APPLICATION CONSTANTS
// ============================================================
define('APP_NAME',    'SRM Bidding Portal');
define('APP_VERSION', '1.0.0');
define('APP_URL',     getenv('APP_URL') ?: 'http://localhost/srm-bidding-system');
define('APP_TIMEZONE', 'Asia/Kolkata');

// Set application timezone
date_default_timezone_set(APP_TIMEZONE);

// ============================================================
// SESSION CONFIGURATION
// Must be set before session_start() is called.
// ============================================================

/** Session inactivity timeout in seconds (30 minutes) */
define('SESSION_TIMEOUT',  1800);

/** Name of the session cookie (avoid generic names like "PHPSESSID") */
define('SESSION_NAME',     'SRM_SESS');

/** Session save path - defaults to system temp; override in production */
define('SESSION_SAVE_PATH', getenv('SESSION_SAVE_PATH') ?: session_save_path());

// Apply session INI settings (must be called before session_start())
ini_set('session.name',             SESSION_NAME);
ini_set('session.gc_maxlifetime',   (string) SESSION_TIMEOUT);
ini_set('session.use_strict_mode',  '1');
ini_set('session.cookie_httponly',  '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_samesite',  'Strict');

// Enforce HTTPS cookie in production
if (APP_ENV === 'production') {
    ini_set('session.cookie_secure', '1');
}

if (SESSION_SAVE_PATH !== '') {
    ini_set('session.save_path', SESSION_SAVE_PATH);
}

// ============================================================
// SECURITY CONSTANTS
// ============================================================

/** CSRF token field name used in forms and verified on POST */
define('CSRF_TOKEN_NAME',  '_csrf_token');

/** Length of the CSRF token in bytes (generates 64-char hex string) */
define('CSRF_TOKEN_BYTES', 32);

/** Bcrypt cost factor for password hashing (12 is a good balance) */
define('PASSWORD_COST',    12);

/** Maximum failed login attempts before temporary lockout */
define('MAX_LOGIN_ATTEMPTS', 5);

/** Lockout duration in seconds after exceeding failed attempts (15 min) */
define('LOCKOUT_DURATION',   900);

/** Allowed admin IP addresses (empty = allow all) */
define('ADMIN_ALLOWED_IPS', []);

// ============================================================
// FILE UPLOAD CONFIGURATION
// ============================================================

/** Maximum file size per upload in bytes (10 MB) */
define('MAX_FILE_SIZE',     10 * 1024 * 1024);

/** Maximum number of files per bid submission */
define('MAX_FILES_PER_BID', 5);

/** Allowed MIME types for bid attachments */
define('ALLOWED_MIME_TYPES', [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
]);

/** Allowed file extensions (double-checked against MIME type) */
define('ALLOWED_EXTENSIONS', [
    'pdf', 'doc', 'docx', 'xls', 'xlsx',
    'jpg', 'jpeg', 'png', 'gif', 'txt', 'zip',
]);

// ============================================================
// PAGINATION
// ============================================================
define('ITEMS_PER_PAGE', 15);

// ============================================================
// RFQ CONFIGURATION
// ============================================================

/** Prefix used when auto-generating RFQ numbers */
define('RFQ_NUMBER_PREFIX', 'RFQ');

/** Current year appended to RFQ number prefix */
define('RFQ_YEAR', (int) date('Y'));

// ============================================================
// EMAIL CONFIGURATION (SMTP - for future integration)
// ============================================================
define('MAIL_HOST',       getenv('MAIL_HOST')       ?: 'smtp.mailtrap.io');
define('MAIL_PORT',       (int)(getenv('MAIL_PORT') ?: 587));
define('MAIL_USERNAME',   getenv('MAIL_USERNAME')   ?: '');
define('MAIL_PASSWORD',   getenv('MAIL_PASSWORD')   ?: '');
define('MAIL_ENCRYPTION', getenv('MAIL_ENCRYPTION') ?: 'tls');
define('MAIL_FROM_EMAIL', getenv('MAIL_FROM_EMAIL') ?: 'noreply@srm-bidding.local');
define('MAIL_FROM_NAME',  getenv('MAIL_FROM_NAME')  ?: APP_NAME);

// ============================================================
// LOGGING
// ============================================================
define('LOG_ENABLED',  true);
define('LOG_LEVEL',    APP_ENV === 'development' ? 'debug' : 'error');
define('LOG_FILE',     LOGS_PATH . DIRECTORY_SEPARATOR . 'app-' . date('Y-m-d') . '.log');

// Ensure required directories exist
$_requiredDirs = [UPLOAD_PATH, LOGS_PATH];
foreach ($_requiredDirs as $_dir) {
    if (!is_dir($_dir)) {
        mkdir($_dir, 0755, true);
    }
}
unset($_requiredDirs, $_dir);
