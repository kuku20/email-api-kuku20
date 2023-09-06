// blogPageQuery.ts

export const blogPageQuery = `
  query proFolioEntryQuery {
    proFolio(id: "DAMTTkOHJKjtTHpQ4wlLh") {
      sys {
        id
      }
      hello
      aboutCollection {
        items {
          title
          details {
            json
          }
        }
      }
      mySkills {
        title
        details {
          json
        }
      }
      myExpCollection {
        items {
          title
          details {
            json
          }
        }
      }
    }
  }
`;
// blogPageQuery.ts

// export const blogPageQuery = `
//   query GetProFolioCollection($preview: Boolean) {
//     proFolioCollection(preview: $preview) {
//       items {
//         hello
//       }
//     }
//   }
// `;

