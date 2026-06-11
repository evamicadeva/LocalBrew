# LocalBrew

## Autori

- [Eva](https://github.com/evamicadeva)
- [Stefano](https://github.com/ste-riiba)
- [Gabriel](https://github.com/GabriR02)
- [Walid](https://github.com/WalidDalal)
- [Dario](https://github.com/Thario02)

LocalBrew è una web application full-stack per la scoperta e la gestione di locali, pub e birrifici artigianali.
L’applicazione permette agli utenti di esplorare i locali su una mappa interattiva, consultare drink e recensioni,
salvare preferiti e contribuire con valutazioni. I proprietari possono gestire locali e bevande, mentre gli
amministratori moderano i contenuti pubblicati.

Il progetto integra un backend REST con autenticazione JWT e un frontend statico modulare, con una UX centrata sulla
ricerca geografica e sulla consultazione rapida delle informazioni.

## Funzionalità

### Esplorazione pubblica

- Mappa interattiva dei locali attivi con Leaflet.
- Marker clustering per gestire più punti sulla mappa.
- Ricerca di locali per nome, città e tipologia.
- Filtro dei locali in base alle categorie di birra disponibili.
- Scheda dettaglio del locale con informazioni, drink associati e recensioni.
- Visualizzazione delle valutazioni medie di locali e drink.
- Tema chiaro/scuro lato frontend.

### Utenti autenticati

- Registrazione e login tramite JWT.
- Gestione del profilo personale.
- Salvataggio e rimozione di locali preferiti.
- Salvataggio e rimozione di drink preferiti.
- Creazione, modifica e cancellazione delle proprie recensioni sui locali.
- Creazione, modifica e cancellazione delle proprie valutazioni sui drink.

### Proprietari

- Creazione, aggiornamento e cancellazione dei propri locali.
- Upload immagini per locali e drink.
- Creazione e gestione del catalogo drink.
- Associazione dei drink ai locali gestiti.
- Consultazione dei locali in gestione tramite dashboard dedicata.

### Amministratori

- Consultazione completa dei locali registrati.
- Moderazione dei locali tramite stati `PENDING`, `ACTIVE` e `SUSPENDED`.
- Approvazione o sospensione dei locali.
- Gestione dei ruoli utente.
- Moderazione delle recensioni.

## Stack

### Backend

- Java 25
- Spring Boot 4.0.6
- Spring Web MVC
- Spring Data JPA
- Spring Security
- JWT con `jjwt`
- Bean Validation
- Lombok
- MySQL
- Maven

### Frontend

- HTML5
- CSS3
- JavaScript ES Modules
- Leaflet
- Leaflet MarkerCluster
- Font Awesome

### Integrazioni

- Nominatim/OpenStreetMap per il geocoding degli indirizzi.
- Upload locale di immagini per locali e drink.

## Architettura

Il backend segue una struttura a livelli, separando controller, DTO, servizi, repository ed entity JPA. Questa
organizzazione mantiene distinte le responsabilità tra API, logica applicativa e persistenza.

```text
src/main/java/com/project/localbrew
+-- config          # Configurazione Spring Security, CORS e risorse web
+-- controller      # REST controller per auth, utenti, locali, drink e dashboard
+-- dto             # Request e response DTO
+-- entity          # Entity JPA ed enum di dominio
+-- exception       # Gestione centralizzata degli errori applicativi
+-- repository      # Repository Spring Data JPA
+-- security        # Filtro JWT, UserDetailsService e utente corrente
+-- service         # Logica applicativa e integrazioni esterne

src/main/resources/static
+-- index.html      # Pagina principale con mappa e ricerca
+-- pages           # Login, registrazione, profilo, dashboard owner/admin
+-- css             # Stili suddivisi per area dell'interfaccia
+-- js              # Moduli frontend per API, UI, auth, mappe e dashboard
```

## Sicurezza e ruoli

L’autenticazione è stateless e basata su token JWT. Le password vengono salvate con hashing BCrypt. Le API sono
organizzate per area di accesso:

| Prefisso            | Accesso                           |
|---------------------|-----------------------------------|
| `/api/v1/auth/**`   | Pubblico, registrazione e login   |
| `/api/v1/public/**` | Pubblico, consultazione contenuti |
| `/api/v1/user/**`   | Utenti autenticati                |
| `/api/v1/owner/**`  | Proprietari e amministratori      |
| `/api/v1/admin/**`  | Amministratori                    |

## Modello dati

Le principali entità del dominio sono:

- `User`: account applicativo con ruolo.
- `Venue`: locale geolocalizzato, collegato a un proprietario e a uno stato di moderazione.
- `Drink`: bevanda con categoria, descrizione, gradazione, origine e immagine.
- `VenueDrink`: associazione tra locale e drink.
- `VenueReview`: recensione di un utente su un locale.
- `DrinkRating`: valutazione di un utente su un drink.
- `FavoriteVenue`: locale salvato tra i preferiti.
- `FavoriteDrink`: drink salvato tra i preferiti.

## API principali

| Area   | Endpoint                                      | Descrizione                        |
|--------|-----------------------------------------------|------------------------------------|
| Auth   | `POST /api/v1/auth/register`                  | Registrazione utente               |
| Auth   | `POST /api/v1/auth/login`                     | Login e generazione JWT            |
| Public | `GET /api/v1/public/venues/active`            | Elenco dei locali attivi           |
| Public | `GET /api/v1/public/venues/{id}`              | Dettaglio di un locale             |
| Public | `GET /api/v1/public/venues/search/city`       | Ricerca locali per città           |
| Public | `GET /api/v1/public/venues/search/name`       | Ricerca locali per nome            |
| Public | `GET /api/v1/public/venues/search/type`       | Ricerca locali per tipologia       |
| Public | `GET /api/v1/public/drinks`                   | Ricerca drink per nome o categoria |
| Public | `GET /api/v1/public/venues/{venueId}/reviews` | Recensioni di un locale            |
| Public | `GET /api/v1/public/venues/{venueId}/drinks`  | Drink associati a un locale        |
| User   | `GET /api/v1/user/me`                         | Profilo dell’utente corrente       |
| User   | `POST /api/v1/user/favorite-venues`           | Aggiunta locale ai preferiti       |
| User   | `POST /api/v1/user/favorite-drinks`           | Aggiunta drink ai preferiti        |
| User   | `POST /api/v1/user/venue-reviews`             | Creazione recensione               |
| User   | `POST /api/v1/user/drinks/{id}/ratings`       | Valutazione drink                  |
| Owner  | `POST /api/v1/owner/venues`                   | Creazione locale                   |
| Owner  | `POST /api/v1/owner/drinks`                   | Creazione drink                    |
| Owner  | `POST /api/v1/owner/venues/{venueId}/drinks`  | Associazione drink a locale        |
| Owner  | `POST /api/v1/owner/images/venue`             | Upload immagine locale             |
| Owner  | `POST /api/v1/owner/images/drink`             | Upload immagine drink              |
| Admin  | `PATCH /api/v1/admin/venues/{id}/activate`    | Approvazione locale                |
| Admin  | `PATCH /api/v1/admin/venues/{id}/suspend`     | Sospensione locale                 |
| Admin  | `PATCH /api/v1/admin/users/{id}/role`         | Aggiornamento ruolo utente         |

## Avvio locale

### Prerequisiti

- Java 25
- MySQL
- Maven, oppure Maven Wrapper incluso nel repository

### Database

Creare un database MySQL:

```sql
CREATE DATABASE localbrew_db;
```

Configurazione predefinita:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/localbrew_db?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
```

Se necessario, aggiornare le credenziali in `src/main/resources/application.properties`.

### Esecuzione

Da root del progetto:

```bash
./mvnw spring-boot:run
```

Su Windows:

```bash
mvnw.cmd spring-boot:run
```

L’applicazione è disponibile all’indirizzo:

```text
http://localhost:8080
```

## Test

Per eseguire i test:

```bash
./mvnw test
```

La suite attuale include un test di caricamento del contesto Spring. Ulteriori test possono essere aggiunti su service,
repository e controller per coprire i flussi principali.

## Note tecniche

- I locali creati dagli owner seguono un workflow di moderazione prima della pubblicazione.
- Il geocoding viene eseguito tramite Nominatim e limita la ricerca al territorio italiano.
- Le immagini caricate vengono salvate localmente nella cartella configurata da `upload.base-path`.
- Il frontend usa moduli JavaScript separati per API, autenticazione, mappa, preferiti, dashboard e UI.
- La configurazione CORS consente l’uso sia dal server Spring Boot sia da ambienti frontend locali.

## Possibili evoluzioni

- Spostare credenziali database e `jwt.secret` su variabili d’ambiente.
- Introdurre migrazioni database con Flyway o Liquibase.
- Aggiungere documentazione OpenAPI/Swagger.
- Estendere la copertura dei test.
- Aggiungere paginazione, ordinamento e filtri avanzati sulle liste.
- Preparare dati seed per demo e ambienti di sviluppo.

## Licenza

Il progetto include una licenza Apache 2.0 nel file `LICENSE`.
