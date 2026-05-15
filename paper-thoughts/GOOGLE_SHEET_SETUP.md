# Google Sheet Setup: Lore Keeper Archive

Follow these instructions exactly to ensure your backend is compatible with the website.

## 1. Column Schema (Tab 1)

Ensure your main registration sheet has the following columns in this **EXACT** order (A through P):

| Column | Field | Notes |
| :--- | :--- | :--- |
| **A** | **LK-ID** | Auto-generated (e.g., LK-2026-0001) |
| **B** | **Full Name** | Required |
| **C** | **Instagram Handle** | **Primary Key** for duplicate detection |
| **D** | **WhatsApp Number** | Required |
| **E** | **Email** | Optional (for future Auth) |
| **F** | **Chapter** | ABU / Kaduna / Abuja / Other |
| **G** | **Referred by** | Captured from URL or manual input |
| **H** | **Purchases** | Start at 0 |
| **I** | **Referrals** | Start at 0 |
| **J** | **Events Attended** | Start at 0 |
| **K** | **Tier** | Default: `Reader` |
| **L** | **Date Tier Earned** | Auto-stamped |
| **M** | **Patron** | Y/N |
| **N** | **Date Registered** | Auto-stamped |
| **O** | **Consent Given** | TRUE/FALSE |
| **P** | **Notes** | Internal manual use |

---

## 2. Google Apps Script Code

Replace your existing Apps Script code with this version. It includes duplicate detection via Instagram handle and automatic LK-ID generation.

```javascript
/**
 * Lore Keeper Archive Master Handler
 * Handles data from /api/register, /api/checkin, /api/lookup, /api/events, and /api/me
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || "register";
    var ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1asZRaSP_-nyqnMQI0GbOUjwz1OTcaconlsFJR6vCuzk/edit?resourcekey=&gid=1339262612#gid=1339262612");
    
    if (action === "register") {
      return handleRegistration(data, ss);
    } else if (action === "checkin") {
      return handleCheckin(data, ss);
    } else if (action === "lookup") {
      return handleLookup(data, ss);
    } else if (action === "getEvents") {
      return handleGetEvents(ss);
    } else if (action === "getProfile") {
      return handleGetProfile(data, ss);
    } else if (action === "createOrder") {
      return handleCreateOrder(data, ss);
    } else if (action === "getOrders") {
      return handleGetOrders(ss);
    } else if (action === "getMemberOrders") {
      return handleGetMemberOrders(data, ss);
    } else if (action === "finalizeOrder") {
      return handleFinalizeOrder(data, ss);
    } else if (action === "deleteOrder") {
      return handleDeleteOrder(data, ss);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetMemberOrders(data, ss) {
  var sheet = ss.getSheetByName("Orders");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: true, orders: [] })).setMimeType(ContentService.MimeType.JSON);
  
  var email = data.email.toLowerCase();
  var sheetData = sheet.getDataRange().getValues();
  var memberOrders = [];
  
  for (var i = 1; i < sheetData.length; i++) {
    if (sheetData[i][2].toString().toLowerCase() === email) { // Column C is Email
      memberOrders.push({
        date: sheetData[i][0],
        items: sheetData[i][3],
        total: sheetData[i][6],
        status: sheetData[i][7],
        orderId: sheetData[i][8]
      });
    }
  }
  
  memberOrders.reverse();
  return ContentService.createTextOutput(JSON.stringify({ success: true, orders: memberOrders })).setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteOrder(data, ss) {
  var sheet = ss.getSheetByName("Orders");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Sheet missing" })).setMimeType(ContentService.MimeType.JSON);
  
  var orderId = data.orderId;
  var orderData = sheet.getDataRange().getValues();
  
  for (var i = 1; i < orderData.length; i++) {
    if (orderData[i][8] == orderId) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Order not found" })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetOrders(ss) {
  var sheet = ss.getSheetByName("Orders");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: true, orders: [] })).setMimeType(ContentService.MimeType.JSON);
  
  var data = sheet.getDataRange().getValues();
  var orders = [];
  
  // Skip header
  for (var i = 1; i < data.length; i++) {
    orders.push({
      date: data[i][0],
      lkid: data[i][1],
      name: data[i][2],
      items: data[i][3],
      subtotal: data[i][4],
      discount: data[i][5],
      total: data[i][6],
      status: data[i][7],
      orderId: data[i][8],
      salesRep: data[i][9]
    });
  }
  
  // Sort by date descending
  orders.reverse();
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, orders: orders })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * NEW: Finalize Order (Mark as Paid & Set Books to Sold Out)
 */
function handleFinalizeOrder(data, ss) {
  var orderSheet = ss.getSheetByName("Orders");
  var bookSheet = ss.getSheetByName("Archive");
  if (!orderSheet || !bookSheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Sheets missing" })).setMimeType(ContentService.MimeType.JSON);
  
  var orderId = data.orderId;
  var orderData = orderSheet.getDataRange().getValues();
  var rowIndex = -1;
  
  // Find the order row by ID (Column I)
  for (var i = 1; i < orderData.length; i++) {
    if (orderData[i][8] == orderId) { // Column I is index 8
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Order not found" })).setMimeType(ContentService.MimeType.JSON);
  
  // 1. Update Order Status to "Paid"
  orderSheet.getRange(rowIndex, 8).setValue("Paid"); // Column H
  
  // 2. Extract books from the order row (Column D)
  var itemsText = orderData[rowIndex-1][3]; // "Book A (Price), Book B (Price)"
  var bookTitles = itemsText.split(", ").map(function(s) { 
    return s.split(" (")[0].toLowerCase().trim(); 
  });
  
  // 3. Mark books as "Sold Out" in Archive tab
  var archiveData = bookSheet.getDataRange().getValues();
  for (var j = 3; j < archiveData.length; j++) {
    var title = archiveData[j][1].toString().toLowerCase().trim();
    if (bookTitles.indexOf(title) !== -1) {
      bookSheet.getRange(j + 1, 6).setValue("Sold Out"); // Column F
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function handleCreateOrder(data, ss) {
  var orderSheet = ss.getSheetByName("Orders");
  if (!orderSheet) {
    orderSheet = ss.insertSheet("Orders");
    orderSheet.appendRow(["Date", "LK-ID", "Name", "Items", "Subtotal", "Discount", "Total", "Status", "Order ID", "Sales Rep"]);
  }
  
  var orderId = "ORD-" + Math.floor(Math.random() * 1000000);
  var rowData = [
    new Date(),
    data.lkid || "Guest",
    data.name || "Anonymous",
    data.items.map(function(i) { return i.title + " (₦" + i.price + ")"; }).join(", "),
    data.subtotal,
    data.discount,
    data.total,
    "Pending",
    orderId,
    data.salesRep || "System"
  ];
  
  orderSheet.appendRow(rowData);
  
  // SEND ADMIN EMAIL ALERT
  try {
    var adminEmail = "umorgan2001@gmail.com";
    var subject = "🚨 New Archive Order Logged: " + orderId;
    var body = "Lore Keeper,\n\nA new book order has been logged from the Archive.\n\n" +
               "Customer: " + (data.name || "Anonymous") + "\n" +
               "LK-ID: " + (data.lkid || "Guest") + "\n" +
               "Total: ₦" + data.total + "\n" +
               "Order ID: " + orderId + "\n\n" +
               "Manage this order at: https://www.paperthoughts.org/admin/orders\n\n" +
               "We live in the lines.";
    
    MailApp.sendEmail(adminEmail, subject, body);
  } catch (e) {
    Logger.log("Email failed: " + e.toString());
  }
  
  // Also update 'Last Interest' in the Archive (books) tab
  var bookSheet = ss.getSheetByName("Archive");
  if (bookSheet) {
    var bookData = bookSheet.getDataRange().getValues();
    var itemTitles = data.items.map(function(i) { return i.title.toLowerCase(); });
    
    for (var i = 3; i < bookData.length; i++) {
      var bookTitle = bookData[i][1].toString().toLowerCase();
      if (itemTitles.indexOf(bookTitle) !== -1) {
        bookSheet.getRange(i + 1, 10).setValue(new Date()); // Column J
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, orderId: orderId })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tab 1: Archive (Books)
 * Column A: SN/ID
 * ...
 * Column I: Image URL
 * Column J: Last Interest (Timestamp) [NEW]
 */
function handleRegistration(data, ss) {
  var sheet = ss.getSheetByName("Archive");
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Sheet named 'Archive' not found." })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 1. Duplicate Detection
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var igHandles = sheet.getRange("C2:C" + lastRow).getValues().flat();
    if (data.instagram && igHandles.indexOf(data.instagram) !== -1) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "This Instagram handle is already registered." })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var emails = sheet.getRange("E2:E" + lastRow).getValues().flat();
    if (data.email && emails.indexOf(data.email) !== -1) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "This email address is already registered." })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // 2. Generate LK-ID
  var year = new Date().getFullYear();
  var lkId = "LK-" + year + "-" + (lastRow + 1000).toString();
  
  // 3. Map Data (A-P)
  var rowData = [
    lkId, data.fullName, data.instagram, data.whatsapp, data.email || "",
    data.chapter, data.referral || "", 0, 0, 0, "Reader", "", "N", new Date(), data.consent, ""
  ];
  
  sheet.appendRow(rowData);
  
  if (data.email) sendWelcomeMessage(data.email, data.fullName, lkId);
  if (data.referral) updateReferrerCount(ss, data.referral);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, lkId: lkId })).setMimeType(ContentService.MimeType.JSON);
}

function handleCheckin(data, ss) {
  var sheet = ss.getSheetByName("Archive");
  var logSheet = ss.getSheetByName("Event Log");
  var eventsSheet = ss.getSheetByName("Events List");
  
  if (!sheet || !logSheet || !eventsSheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Missing Archive, Event Log, or Events List tab" })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var lkid = data.lkid.trim().toUpperCase();
  var eventName = data.event;
  var providedSecret = data.secret ? data.secret.trim() : "";
  
  // Verify the Secret
  var eventLastRow = eventsSheet.getLastRow();
  if (eventLastRow <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "No events are currently configured." })).setMimeType(ContentService.MimeType.JSON);
  }
  var eventData = eventsSheet.getRange("A2:D" + eventLastRow).getValues();
  var isPhysical = false;
  var secretValid = false;
  
  for (var i = 0; i < eventData.length; i++) {
    if (eventData[i][0] === eventName && String(eventData[i][3]).toLowerCase().trim() === "active") {
      if (String(eventData[i][2]).trim() === providedSecret) {
        secretValid = true;
        isPhysical = String(eventData[i][1]).toLowerCase().trim() === "physical";
        break;
      }
    }
  }
  
  if (!secretValid) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Incorrect Event Cipher. Please check the code at the venue." })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var pointsToAdd = isPhysical ? 2 : 1; // 2 pts for physical, 1 pt for virtual
  
  var lastRow = sheet.getLastRow();
  var fullData = sheet.getRange("A2:L" + lastRow).getValues();
  
  for (var i = 0; i < fullData.length; i++) {
    if (fullData[i][0] === lkid) {
      var currentPoints = fullData[i][9] || 0; // Column J (Events Attended / Points)
      var newPoints = currentPoints + pointsToAdd;
      
      sheet.getRange(i + 2, 10).setValue(newPoints); // Update points
      logSheet.appendRow([new Date(), lkid, eventName, isPhysical ? "Physical" : "Virtual"]); // Log it
      
      // Upgrade logic (6 points = 3 physical OR 6 virtual)
      var currentTier = fullData[i][10];
      if (currentTier === "Reader" && newPoints >= 6) {
        sheet.getRange(i + 2, 11).setValue("Keeper");
        sheet.getRange(i + 2, 12).setValue(new Date());
        var email = fullData[i][4];
        if (email) sendKeeperCongrats(email, fullData[i][1], lkid);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, name: fullData[i][1], points: newPoints })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "LK-ID not found" })).setMimeType(ContentService.MimeType.JSON);
}

function handleLookup(data, ss) {
  var sheet = ss.getSheetByName("Archive");
  var query = data.query.trim().toLowerCase().replace('@', '');
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Member not found" })).setMimeType(ContentService.MimeType.JSON);
  
  var fullData = sheet.getRange("A2:E" + lastRow).getValues(); // Read up to Column E
  
  for (var i = 0; i < fullData.length; i++) {
    var ig = String(fullData[i][2]).toLowerCase().replace('@', ''); // Col C
    var email = String(fullData[i][4]).toLowerCase(); // Col E
    
    if (ig === query || email === query) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, lkid: fullData[i][0], name: fullData[i][1] })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Member not found" })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetEvents(ss) {
  var sheet = ss.getSheetByName("Events List");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Events List tab not found" })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return ContentService.createTextOutput(JSON.stringify({ success: true, events: [] })).setMimeType(ContentService.MimeType.JSON);
  
  // Fetch columns A through I
  var data = sheet.getRange("A2:I" + lastRow).getValues();
  var events = [];
  
  for (var i = 0; i < data.length; i++) {
    var status = String(data[i][3]).toLowerCase().trim(); // Column D
    if (status === "active") {
      events.push({
        name: data[i][0],
        type: String(data[i][1]).toLowerCase().trim(),
        date: data[i][4],
        time: data[i][5],
        location: data[i][6],
        description: data[i][7],
        rsvpLink: data[i][8]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, events: events })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetProfile(data, ss) {
  var sheet = ss.getSheetByName("Archive");
  var email = data.email ? data.email.trim().toLowerCase() : "";
  
  if (!email) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Email not provided." })).setMimeType(ContentService.MimeType.JSON);
  }
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Archive tab not found" })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Profile not found." })).setMimeType(ContentService.MimeType.JSON);
  
  var fullData = sheet.getRange("A2:L" + lastRow).getValues();
  
  for (var i = 0; i < fullData.length; i++) {
    var memberEmail = String(fullData[i][4]).toLowerCase().trim(); // Col E
    
    if (memberEmail === email && memberEmail !== "") {
      var profile = {
        lkid: fullData[i][0],
        name: fullData[i][1],
        chapter: fullData[i][5],
        purchases: fullData[i][7] || 0,
        referrals: fullData[i][8] || 0,
        events: fullData[i][9] || 0,
        tier: fullData[i][10]
      };
      return ContentService.createTextOutput(JSON.stringify({ success: true, profile: profile })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Profile not found for this email address. Please make sure you registered with this exact email." })).setMimeType(ContentService.MimeType.JSON);
}

function sendWelcomeMessage(email, name, lkid) {
  var subject = "Welcome to the Paper Thoughts Archive";
  var body = "Hello " + name + ",\n\nWelcome to the Paper Thoughts Archive. Your official ID is: " + lkid + "\n\nYou are starting as a Reader. To unlock the Keeper tier and get a permanent 10% discount on all orders, invite 5 friends to the Archive.\n\nShare your personal referral link: https://paperthoughts.vercel.app/join?ref=" + lkid + "\n\nThe Archive awaits,\nPaper Thoughts";
  MailApp.sendEmail(email, subject, body);
}

function updateReferrerCount(ss, referrerId) {
  var sheet = ss.getSheetByName("Archive");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  
  var fullData = sheet.getRange("A2:L" + lastRow).getValues();
  for (var i = 0; i < fullData.length; i++) {
    if (fullData[i][0] === referrerId) {
      var newCount = (fullData[i][8] || 0) + 1; // Col I (Referrals)
      sheet.getRange(i + 2, 9).setValue(newCount);
      
      var currentTier = fullData[i][10]; // Col K
      if (currentTier === "Reader" && newCount >= 5) {
        sheet.getRange(i + 2, 11).setValue("Keeper");
        sheet.getRange(i + 2, 12).setValue(new Date());
        var email = fullData[i][4];
        if (email) sendKeeperCongrats(email, fullData[i][1], referrerId);
      }
      break;
    }
  }
}

function sendKeeperCongrats(email, name, lkid) {
  var subject = "You are now a Keeper - Paper Thoughts Archive";
  var body = "Hello " + name + ",\n\nCongratulations! You have earned Keeper status in the Paper Thoughts Archive.\n\nYour 10% Cipher discount is now active. Quote your LK-ID (" + lkid + ") when placing any order to apply it.\n\nThank you for building this community with us.\n\nPaper Thoughts";
  MailApp.sendEmail(email, subject, body);
}
```

## 3. Deployment
1.  In Google Sheets, go to **Extensions > Apps Script**.
2.  Paste the code above.
3.  Click **Deploy > New Deployment**.
4.  Select type: **Web App**.
5.  Set "Execute as": **Me**.
6.  Set "Who has access": **Anyone**.
7.  Copy the **Web App URL** and add it to your Vercel Environment Variables as `GAS_WEBAPP_URL`.
