# TrueWrist Backend

Spring Boot 4 + PostgreSQL + JWT + Google OAuth2 backend for the watch AR storefront.
Mirrors the frontend domain model (`User` / `Shop` / `Watch`, roles `admin | shop | customer`).

## Stack
- Java 25, Spring Boot 4.0.x (Maven, wrapper included — no local Maven needed)
- Spring Security (stateless JWT) + OAuth2 client (Google login)
- Spring Data JPA + PostgreSQL (`specs` stored as `jsonb`)

## Prerequisites
- JDK 25 on `PATH`
- PostgreSQL running, and a database named `truewrist`:

  ```powershell
  & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres truewrist
  ```

## Configuration
All settings have dev defaults in `application.yml` and can be overridden via environment
variables — see `.env.example`. Key ones: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`,
`JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Run
```powershell
# set DB creds first if not postgres/postgres
$env:DB_PASSWORD = "yourpassword"
.\mvnw.cmd spring-boot:run
```
On first start, demo data is seeded automatically (disable with `SEED_ENABLED=false`).

### Demo accounts (password seeded with BCrypt)
| Email             | Password  | Role     |
|-------------------|-----------|----------|
| admin@watch.vn    | admin123  | admin    |
| aventus@watch.vn  | shop123   | shop     |
| poly@watch.vn     | shop123   | shop     |
| khach@watch.vn    | khach123  | customer |

## API
Base URL: `http://localhost:8888`

### Auth
| Method | Path                | Access      | Body / notes |
|--------|---------------------|-------------|--------------|
| POST   | `/api/auth/login`   | public      | `{email, password}` → `{token, user}` |
| POST   | `/api/auth/register`| public      | `{name, email, password}` → customer account |
| GET    | `/api/auth/me`      | bearer      | current user |
| GET    | `/oauth2/authorization/google` | public | starts Google login; redirects to `OAUTH2_SUCCESS_REDIRECT?token=...` |

Send the token on protected calls: `Authorization: Bearer <token>`.

### Watches
| Method | Path                | Access            |
|--------|---------------------|-------------------|
| GET    | `/api/watches`      | public (`?shopId=`)|
| GET    | `/api/watches/{id}` | public            |
| POST   | `/api/watches`      | admin, shop       |
| PUT    | `/api/watches/{id}` | admin, shop (own) |
| DELETE | `/api/watches/{id}` | admin, shop (own) |

### Shops
| Method | Path               | Access            |
|--------|--------------------|-------------------|
| GET    | `/api/shops`       | public            |
| GET    | `/api/shops/{id}`  | public            |
| POST   | `/api/shops`       | admin             |
| PUT    | `/api/shops/{id}`  | admin, shop (own) |
| DELETE | `/api/shops/{id}`  | admin (cascades watches + unlinks owners) |

### Users
| Method | Path               | Access |
|--------|--------------------|--------|
| GET    | `/api/users`       | admin  |
| GET    | `/api/users/{id}`  | admin  |
| POST   | `/api/users`       | admin  |
| PUT    | `/api/users/{id}`  | admin  |
| DELETE | `/api/users/{id}`  | admin  |

## Google login setup
1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application).
2. Authorized redirect URI: `http://localhost:8888/login/oauth2/code/google`.
3. Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. Frontend links to `http://localhost:8888/oauth2/authorization/google`; after success the
   browser lands on `OAUTH2_SUCCESS_REDIRECT?token=<jwt>` — read the token and store it.
