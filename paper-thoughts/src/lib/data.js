import Papa from 'papaparse';

const BOOKS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSNReSyOrpRvtiNDDHhA6hnIzKcXS7uPBZiwSbAw3kHLfPuv5qLq8CJfX8MijIqpe4xK5i0TuK7hEnl/pub?output=csv&gid=0';
const IMAGES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSNReSyOrpRvtiNDDHhA6hnIzKcXS7uPBZiwSbAw3kHLfPuv5qLq8CJfX8MijIqpe4xK5i0TuK7hEnl/pub?output=csv&gid=443476089';

function convertDriveLink(url) {
  if (!url || !url.includes('drive.google.com')) return null;
  const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `/api/image?id=${idMatch[1]}`;
  }
  return url;
}

export async function getBooks() {
  const res = await fetch(BOOKS_CSV_URL, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Failed to fetch books data');
  const csvText = await res.text();
  
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data.slice(3);
        const books = rawRows.map(row => {
          const ratingNum = parseFloat(row[7]?.trim()) || 0;
          return {
            id: row[0]?.trim(),
            title: row[1]?.trim(),
            author: row[2]?.trim(),
            genre: row[3]?.trim(),
            price: row[4]?.trim().replace(/,/g, ''),
            status: row[5]?.trim(),
            description: row[6]?.trim(),
            rating: ratingNum,
            imageUrl: convertDriveLink(row[8]?.trim()) || null,
            featured: ratingNum > 4.2
          };
        }).filter(b => b.id && b.title);
        resolve(books);
      }
    });
  });
}

export async function getImages() {
  const res = await fetch(IMAGES_CSV_URL, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Failed to fetch images data');
  const csvText = await res.text();
  
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        // Find which lines correspond to which sections
        const images = {
          community: [],
          art: [],
          abuja: []
        };
        
        let currentSection = 'community';
        
        const rawRows = results.data.slice(2); // Skip SN,Section,Description header
        rawRows.forEach(row => {
          const sectionLabel = row[1]?.trim().toLowerCase();
          const driveLink = row[3]?.trim();
          
          if (sectionLabel && sectionLabel.includes('art')) currentSection = 'art';
          if (sectionLabel && sectionLabel.includes('abuja')) currentSection = 'abuja';
          
          if (driveLink) {
             const converted = convertDriveLink(driveLink);
             if (converted) images[currentSection].push(converted);
          }
        });
        
        resolve(images);
      }
    });
  });
}
