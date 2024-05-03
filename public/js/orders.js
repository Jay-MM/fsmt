const pendingOrdersContainer = document.getElementById('pending-orders-container');
const processedOrdersContainer = document.getElementById('processed-orders-container');

// Function to format date as MM/DD/YYYY
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate() + 1;
  const year = date.getFullYear();
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
};

const renderOrders = (orders, container) => {
  // Clear previous content
  container.innerHTML = '';

  // Check if orders is an array
  if (!Array.isArray(orders)) {
    // If orders is not an array, create an array with a single element (orders)
    orders = [orders];
  }

  // Create table header row
  let tableHTML = `
    <table>
      <tr>
  `;

  // Include "Process Payment?" header only for pending orders container
  if (container === pendingOrdersContainer) {
    tableHTML += `<th>Process Payment?</th>`;
  }

  // Include other headers
  ['ID', 'Customer Name', 'Description', 'Order Notes', 'Delivery', 'Promised Time', 'Status', 'Paid', 'Date'].forEach(headerText => {
    tableHTML += `<th>${headerText}</th>`;
  });

  // Include "Delete Order?" header only for pending orders container
  if (container === pendingOrdersContainer) {
    tableHTML += `<th>Delete Order?</th>`;
  }

  tableHTML += `</tr>`;

  // Populate table with order data
  orders.forEach(order => {
    tableHTML += `<tr>`;

    // Create "Mark as Processed" button cell only for pending orders
    if (container === pendingOrdersContainer) {
      tableHTML += `
        <td>
          <button class="processed-button" data-id="${order.id}">$</button>
        </td>
      `;
    }

    // Add other cells for order data
    Object.entries(order).forEach(([key, value]) => {
      // Exclude "Process Payment?" and "Delete Order?" cells from processed orders container
      if (!(container === processedOrdersContainer && (key === 'processPayment' || key === 'deleteOrder'))) {
        tableHTML += `<td>${key === 'date' ? formatDate(value) : value}</td>`;
      }
    });

    // Create delete button cell only for pending orders
    if (container === pendingOrdersContainer) {
      tableHTML += `
        <td>
          <button class="delete-button" data-id="${order.id}">x</button>
        </td>
      `;
    }

    tableHTML += `</tr>`;
  });

  tableHTML += `</table>`;

  // Append table HTML to container
  container.innerHTML = tableHTML;

  // Attach event listeners to buttons
  container.querySelectorAll('.processed-button').forEach(button => {
    button.addEventListener('click', () => {
      const orderId = button.dataset.id;
      console.log('Processing order:', orderId);
      // Make API call to mark orders as processed and refresh the table
      fetch(`/api/orders/mark-as-processed/${orderId}`, {
        method: 'PUT'
      })
        .then(response => {
          return response.json();
        })
        .then(() => {
          console.log('Order processed successfully');
          // Refresh the table by fetching and rendering processed orders
          fetchAndRenderAllOrders();
        })
        .catch(err => console.error(err));
    });
  });
  
  // Delete button logic
container.querySelectorAll('.delete-button').forEach(button => {
  button.addEventListener('click', (e) => {
    if(e.target.matches('.delete-button')) {
      const orderId = e.target.dataset.id;
      console.log('Deleting order:', orderId);
      // Make API call to delete order
      fetch(`/api/orders/delete/${orderId}`, {
        method: 'DELETE'
      })
      .then(response => {
        if (response.ok) {
          console.log('Order deleted successfully');
          // Remove the corresponding row from the table
          const row = e.target.closest('tr');
          row.remove();
        } else {
          console.error('Failed to delete order');
        }
      })
      .catch(err => console.error(err));
    }
  });
});

};


// Function to fetch and render orders for all dates
const fetchAndRenderAllOrders = () => {
  Promise.all([
    fetch(`/api/orders/payment/pending`).then(response => response.json()),
    fetch(`/api/orders/payment/processed`).then(response => response.json())
  ])
    .then(([pendingOrders, processedOrders]) => {
      renderOrders(pendingOrders, pendingOrdersContainer);
      renderOrders(processedOrders, processedOrdersContainer);
    })
    .catch(err => console.error(err));
};

// Modify fetchAndRenderOrdersByDate to handle "All Orders"
const fetchAndRenderOrdersByDate = (selectedDate) => {
  if (selectedDate === 'all') {
    fetchAndRenderAllOrders();
  } else {
    Promise.all([
      fetch(`/api/orders/payment/pending?date=${selectedDate}`).then(response => response.json()),
      fetch(`/api/orders/payment/processed?date=${selectedDate}`).then(response => response.json())
    ])
      .then(([pendingOrders, processedOrders]) => {
        renderOrders(pendingOrders, pendingOrdersContainer);
        renderOrders(processedOrders, processedOrdersContainer);
      })
      .catch(err => console.error(err));
  }
};

// Fetch and populate dates, and handle selection change
const fetchAndPopulateDates = () => {
  fetch('/api/orders/dates')
    .then(response => response.json())
    .then(dates => {
      const select = document.getElementById('sales-date-select');
      select.innerHTML = ''; // Clear existing options

      // Sort dates from nearest to furthest
      dates.sort((a, b) => new Date(a) - new Date(b));
      
      // Add "All Orders" option
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'All Orders';
      select.appendChild(allOption);
      
      // Populate select with date options
      dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = formatDate(date);
        select.appendChild(option);
      });
      
      // Trigger fetching and rendering orders when a date is selected
      select.addEventListener('change', () => {
        const selectedDate = select.value;
        fetchAndRenderOrdersByDate(selectedDate);
      });
    })
    .catch(err => console.error(err));
};

// Fetch and render orders for all dates initially
fetchAndRenderAllOrders();
fetchAndPopulateDates();
