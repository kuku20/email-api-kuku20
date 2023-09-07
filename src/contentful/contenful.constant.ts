// blogPageQuery.ts

export const blogPageQuery = `
query proFolioCollectionQuery {
  proFolioCollection(limit: 1) {
    items {
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
      # add the fields you want to query
    }
  }
}
`;
