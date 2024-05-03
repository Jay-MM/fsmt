import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname,'..', 'db', 'data.json')

let jsonData; // Global variable to store JSON data

// Read the JSON file and store its contents in the global variable
fs.readFile(dbPath, 'utf-8', function (err, data) {
  if (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error reading JSON data' });
  }
  jsonData = JSON.parse(data);
});

// Helper function to convert time string to float
function timeStringToFloat(timeString) {
  // Split the time string into hours and minutes
  const [time, meridiem] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  // Adjust for AM/PM
  if (meridiem === "pm" && hours !== 12) {
    hours += 12;
  } else if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  // Calculate the float value
  const floatTime = hours + minutes / 60;
  return floatTime.toFixed(2); // Round to two decimal places
}

// Sort data array by promised time in ascending order
function sortDataByPromisedTimeAscending(data) {
  return data.slice().sort((a, b) => {
    const timeA = timeStringToFloat(a.promised_time);
    const timeB = timeStringToFloat(b.promised_time);
    return timeA - timeB;
  });
}

// Sort data array by date and promised time in ascending order
function sortDataByDateAndTimeAscending(data) {
  return data.slice().sort((a, b) => {
    // First, compare dates
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    } else {
      // If dates are equal, compare promised times
      const timeA = timeStringToFloat(a.promised_time);
      const timeB = timeStringToFloat(b.promised_time);
      return timeA - timeB;
    }
  });
}

// Get unique dates from orders data
function getUniqueDates(data) {
  return [...new Set(data.map(order => order.date))];
}

// API routes
router.get('/orders', (req, res) => {
  let result = jsonData || []; // Use jsonData if available, otherwise empty array

  // Filter orders based on date if specified in query parameters
  if (req.query.date) {
    result = jsonData.filter(order => order.date === req.query.date);
  }
  // Filter orders based on promised time if specified in query parameters
  if (req.query.promised_time === 'lunch') {
    result = jsonData.filter(order => {
      const floatPromisedTime = timeStringToFloat(order.promised_time);
      return floatPromisedTime >= 12;
    });
  } 
  if (req.query.promised_time === 'breakfast') {
    result = jsonData.filter(order => {
      const floatPromisedTime = timeStringToFloat(order.promised_time);
      return floatPromisedTime < 12;
    });
  }

  // Sort orders by date and promised time in ascending order using the new helper function
  result = sortDataByDateAndTimeAscending(result);

  res.json(result);
});

router.post('/orders', (req, res) => {
  // Ensure jsonData is available
  if (!jsonData) {
    return res.status(500).json({ error: 'JSON data not available' });
  }

  const { customer_name, delivery, promised_time, date  } = req.body

  if (!customer_name || !delivery || !promised_time || !date) {
    res.status(400).json({ error: 'Missing customer_name, description, order_notes, delivery, promised_time, status, payment, or date.'})
    return
  }

  // Check if the array is empty
    let lastId;
    if (jsonData.length === 0) {
      // If the array is empty, set ID to 1
      lastId = 0;
    } else {
      // If the array is not empty, get the last animal's ID
      const lastOrder = jsonData[jsonData.length - 1];
      lastId = lastOrder.id;
    }

    // Assign the new id as the last id plus one
    const newOrder = {
      id: lastId + 1,
      ...req.body,
    };

  jsonData.push(newOrder)
 
  // Write the updated jsonData to the file
  fs.writeFile(dbPath, JSON.stringify(jsonData), function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error writing to file' });
    }
    console.log('Data written to file successfully');
    res.json(newOrder);
  });
})

// Endpoint to fetch available dates
router.get('/orders/dates', (req, res) => {
  const uniqueDates = getUniqueDates(jsonData);
  res.json(uniqueDates);
});

// Endpoint to get orders by status
router.get('/orders/status-:status', (req, res) => {
  const pattern = /[a-z]/g;
  const stat = req.params.status;

  if (!pattern.test(stat)) {
    res.status(400).json({ error: 'Not a valid status. Please try again by entering either "complete" or "pending".' });
    return;
  }

  if (!jsonData) {
    return res.status(500).json({ error: 'JSON data not available' });
  }

  // Filter orders by status
  let results = jsonData.filter(s => s.status === stat);

  // Filter orders by date if specified in query parameters
  if (req.query.date) {
    results = results.filter(order => order.date === req.query.date);
  }

  // Sort orders by date and promised time in ascending order
  results = sortDataByDateAndTimeAscending(results);

  if (results.length === 0) {
    return res.status(404).json(`ERROR: "${stat}" not found`);
  }

  res.json(results);
});

// Endpoint to mark orders as complete
router.put('/orders/mark-as-complete/:orderId', (req, res) => {
  const orderId = parseInt(req.params.orderId);
  
  // Find the order by its ID
  const orderIndex = jsonData.findIndex(order => order.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Update the status of the order to "complete"
  jsonData[orderIndex].status = 'complete';

  // Write the updated jsonData to the file
  fs.writeFile(dbPath, JSON.stringify(jsonData), function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error writing to file' });
    }
    console.log('Data written to file successfully');
    res.json({ message: 'Order marked as complete' });
  });
});

// Endpoint to get orders by payment status
router.get('/orders/payment/:paymentStatus', (req, res) => {
  const paymentStatus = req.params.paymentStatus;

  if (paymentStatus !== 'pending' && paymentStatus !== 'processed') {
    return res.status(400).json({ error: 'Invalid payment status. Please provide either "pending" or "processed".' });
  }

  let results = jsonData.filter(order => order.payment === paymentStatus);

  // Filter orders by date if specified in query parameters
  if (req.query.date) {
    results = results.filter(order => order.date === req.query.date);
  }

  // Sort orders by date and promised time in ascending order
  results = sortDataByDateAndTimeAscending(results);

  if (results.length === 0) {
    return res.status(404).json(`ERROR: "${paymentStatus}" not found`);
  }

  
  res.json(results);
});

// Endpoint to mark orders as processed
router.put('/orders/mark-as-processed/:orderId', (req, res) => {
  const orderId = parseInt(req.params.orderId);
  
  // Find the order by its ID
  const orderIndex = jsonData.findIndex(order => order.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Update the status of the order to "processed"
  jsonData[orderIndex].payment = 'processed';

  // Write the updated jsonData to the file
  fs.writeFile(dbPath, JSON.stringify(jsonData), function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error writing to file' });
    }
    console.log('Data written to file successfully');
    res.json({ message: 'Order marked as processed' });
  });
});

//  Endpoint to DELETE orrders
router.delete('/orders/delete/:orderId', (req, res) => {
  const orderId = req.params.orderId
  if (!orderId) {
    return  res.status(400).json({ error: 'An ID must be provided'})
  }
  console.log('DELETE route hit')
  // Modify data  
  const updatedData = jsonData.filter(order => orderId != order.id)
  // stringify contents and re-save file
  fs.writeFile(dbPath, JSON.stringify(updatedData), function(err) {
    if (err) {
      console.error(err)
      return res.status(500).json(err)
    }
    console.log('Data written to file successfully')
    res.json({ message: 'Order has been deleted!' });
  })
})


export default router