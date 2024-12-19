export const CONNECT_TO_STRAPI_CONTENT = `# Strapi API Dokumentation - Wichtige Erkenntnisse

## Schema & Namenskonventionen
1. Immer erst das Schema prüfen via \`strapi_get_content_types\`
   \`\`\`javascript
   // Schema enthält wichtige Informationen:
   {
     "singularName": "article",
     "pluralName": "articles",
     "collectionName": "articles"
   }
   \`\`\`

2. Endpoint-Regeln basierend auf Schema:
   - REST: Nutze \`pluralName\` (api/articles)
   - GraphQL Collection: Nutze \`pluralName\` (query { articles })
   - GraphQL Single: Nutze \`singularName\` (query { article })

## Strapi 5 Spezifische Änderungen
1. **Kein \`id\`-Feld mehr**
2. **Keine \`data\`-Wrapper-Struktur**
3. **Verwendung der \`documentId\` als primärer Identifikator**

### Unterschiede Strapi 4 vs Strapi 5

#### Strapi 4
\`\`\`graphql
query {
  articles {
    data {
      id
      attributes {
        name
        description
      }
    }
  }
}
\`\`\`

#### Strapi 5
\`\`\`graphql
query {
  articles {
    documentId  // Eindeutiger Identifikator
    name
    description
  }
}
\`\`\`

## URL & Webseiten Abrufen
\`webtool\` bietet verschiedene Methoden:
\`\`\`javascript
// 1. Kompletten HTML-Content
webtool_gethtml({
  url: "https://example.com",
  useJavaScript: false  // Optional für dynamische Seiten
})

// 2. Formatierter Markdown-Content
webtool_readpage({
  url: "https://example.com",
  selector: "body", // Optional für spezifischen Content
  useJavaScript: false
})
\`\`\`

## Bild-Upload und Verknüpfung
1. Erst Bild hochladen via \`strapi_upload_media\`
   - URL angeben
   - Metadata (name, caption, alternativeText) mitgeben
   - Format optional (jpeg, png, webp)
   - Bild-ID aus Response merken

2. Dann Bild mit Article verknüpfen via REST
   - PUT request
   - Komplette data-Struktur
   - DocumentId statt numerischer ID
   - Images als Array

\`\`\`javascript
// 1. Bild Upload
strapi_upload_media({
  url: "https://example.com/image.jpg",
  metadata: {
    name: "article-name",
    caption: "Article Caption",
    alternativeText: "Article Alt Text"  
  }
});

// 2. Mit Article verknüpfen
PUT api/articles/{documentId}
{
  "data": {
    "images": [bildId]
  }
}
\`\`\`

## Fehler die auftraten
1. 404 bei numerischer ID
2. 405 bei falschem Endpoint (/article statt /articles)
3. 400 wenn data-Wrapper fehlt
4. 404 wenn documentId fehlt

## GraphQL vs REST
- REST erwies sich als zuverlässiger für Updates
- Bei GraphQL gab es mehr Probleme mit der Authentifizierung
- REST erfordert die richtige Plural-Form des Endpoints (articles)

## GraphQL-Implementierung: Herausforderungen und Lösungen

### Warum GraphQL zunächst nicht funktionierte

1. **Fehlende Konfiguration**: 
   - Frühere Versuche schlugen fehl, weil wahrscheinlich keine explizite GraphQL-Konfiguration vorhanden war
   - Mögliche Ursachen:
     * Deaktivierte GraphQL-Schnittstelle
     * Fehlende Berechtigungen
     * Unvollständige Schema-Konfiguration

2. **Debugging-Strategie**:
   \`\`\`javascript
   // Generische GraphQL-Abfrage, die zunächst fehlschlug
   query {
     articles {
       id
       name
     }
   }
   \`\`\`

### Erfolgreiches GraphQL-Query

3. **Funktionierendes Query-Muster**:
   \`\`\`graphql
   query {
     articles {
       documentId
       name
       type
       description
       images {
         url
         alternativeText
       }
     }
   }
   \`\`\`

### Schlüsselelemente für erfolgreiche GraphQL-Anfragen

- **Vollständige Attribut-Spezifikation**: Alle gewünschten Felder explizit auflisten
- **Kein Pagination-Parameter bei einfachen Abfragen**
- **Präzise Schreibweise der Attribute**

## Best Practices

1. Immer erst Schema prüfen
2. Bei URLs erst mit webtools den Content validieren
3. Bei IDs immer documentId verwenden
4. Bei Updates immer data-Wrapper nutzen
5. Bei Collections pluralName verwenden
6. Bei Single-Entries prüfen ob singular/plural je nach API-Typ
7. In Strapi 5: Direkte Attributabfrage ohne \`data\`-Wrapper
8. \`documentId\` statt \`id\` verwenden

## Debugging

1. Bei 404: Prüfen ob plural/singular Form korrekt
2. Bei 400: Prüfen ob data-Wrapper vorhanden
3. Bei Fehlern bei URLs: Erst mit webtools validieren
4. Bei ID-Problemen: Auf documentId prüfen
5. Schema und Konfiguration in Strapi überprüfen

## Erweiterte GraphQL-Tipps

- **Pagination**: Bei großen Datenmengen Pagination-Parameter verwenden
  \`\`\`graphql
  query {
    articles(pagination: { page: 1, pageSize: 10 }) {
      documentId
      name
    }
  }
  \`\`\`

- **Fehlerbehandlung**: Immer Fehlerbehandlung und detaillierte Fehlermeldungen beachten

## Wichtige Migrations-Hinweise für Strapi 5

- Bestehende Queries müssen angepasst werden
- \`id\`-Referenzen durch \`documentId\` ersetzen
- Keine verschachtelten \`data\`-Strukturen mehr
- Direkte Attributabfrage ohne Wrapper

## Initialisierung: Schema Analyse

Als ersten Schritt rufe ich jetzt das Strapi Schema ab und analysiere die Content Types:

\`\`\`javascript
strapi_get_content_types()
\`\`\`

Ich werde:
1. Alle Content Types und ihre Strukturen erfassen
2. Die korrekten Endpoint-Namen (pluralName/singularName) merken
3. Verfügbare Felder und ihre Typen dokumentieren
4. Relationen zwischen Content Types identifizieren
5. Pflichtfelder und Validierungen beachten

Diese Informationen nutze ich dann für:
- Korrekte API-Endpoint-Konstruktion
- Gültige Feldnamen in Queries
- Typ-sichere Dateneingaben
- Effiziente Relationsabfragen
- Fehlerfreie Schema-Validierung`; 