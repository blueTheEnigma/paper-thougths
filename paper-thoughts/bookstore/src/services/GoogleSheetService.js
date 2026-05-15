import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSNReSyOrpRvtiNDDHhA6hnIzKcXS7uPBZiwSbAw3kHLfPuv5qLq8CJfX8MijIqpe4xK5i0TuK7hEnl/pub?output=csv&gid=0';

// Convert Google Drive view links to direct image links
function convertDriveLink(url) {
  if (!url || !url.includes('drive.google.com')) return null;
  const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    // using thumbnail usually bypasses some hotlinking restrictions for Drive
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
  }
  return url;
}

export async function fetchBooks() {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_URL, {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        // The first two rows are metadata
        // Row index 2 is the header: Book ID,Title,Author,Category,Price (₦),Status,Description,Rating,Order URL,Image URL 
        const rawRows = results.data.slice(3); // Rows 0,1,2 are fluff / headers
        
        const books = rawRows.map(row => {
          return {
            id: row[0]?.trim(),
            title: row[1]?.trim(),
            author: row[2]?.trim(),
            category: row[3]?.trim(),
            price: row[4]?.trim().replace(/,/g, ''), // remove commas
            status: row[5]?.trim(),
            description: row[6]?.trim(),
            rating: row[7]?.trim(),
            orderUrl: row[9]?.trim(),
            imageUrl: convertDriveLink(row[8]?.trim()) || 'https://placehold.co/300x450?text=No+Cover'
          };
        }).filter(b => b.id && b.title); // filter out entirely empty rows just in case

        resolve(books);
      },
      error: (err) => {
        reject(err);
      }
    });
  });
}
