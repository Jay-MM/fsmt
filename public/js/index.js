const select = document.getElementById('select-status');
const ordersContainer = document.getElementById('orders-container');
let markedOrders = [];

// Add "Select an option" as the default option
const defaultOption = document.createElement('option');
defaultOption.text = 'Select an option';
defaultOption.disabled = true;
defaultOption.selected = true;
select.add(defaultOption);


// Function to format date as MM/DD/YYYY
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate() + 1;
  const year = date.getFullYear();
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
};

const renderOrders = (orders, status) => {
  // Limit the orders to 5
  orders = orders.slice(0, 5);
  // Clear previous content
  ordersContainer.innerHTML = '';

  // Create h2 element for order status
  const h2 = document.createElement('h2');
  h2.textContent = `Order Status: ${status}`;

  // Append h2 to orders container
  ordersContainer.appendChild(h2);

  // Create "Mark as Complete" button
  const markAsCompleteBtn = document.createElement('button');
  markAsCompleteBtn.textContent = 'Mark as Complete';
  markAsCompleteBtn.classList.add('complete-btn');
  markAsCompleteBtn.disabled = true;

  // Function to handle "Mark as Complete" button click
  const handleMarkAsComplete = () => {
    // Make API call to mark orders as complete and refresh the table
    if (markedOrders.length > 0) {
      // Make API call to mark orders as complete
      markedOrders.forEach(orderId => {
        // Make API call to mark order as complete using the new endpoint
        fetch(`/api/orders/mark-as-complete/${orderId}`, {
          method: 'PUT'
        })
          .then(response => response.json())
          .then(() => {
            // Refresh the table by fetching and rendering pending orders
            fetchPendingOrders();
          })
          .catch(err => console.error(err));
      });
    }
  };

  // Add "click" event listener to "Mark as Complete" button
  markAsCompleteBtn.addEventListener('click', handleMarkAsComplete);

  // Add "mouseenter" event listener to add "enabled" class
  markAsCompleteBtn.addEventListener('mouseenter', () => {
    if (!markAsCompleteBtn.disabled) {
      markAsCompleteBtn.classList.add('enabled');
    }
  });

  // Add "mouseleave" event listener to remove "enabled" class
  markAsCompleteBtn.addEventListener('mouseleave', () => {
    markAsCompleteBtn.classList.remove('enabled');
  });

  // Append "Mark as Complete" button to the orders container
  ordersContainer.appendChild(markAsCompleteBtn);

  // Create table element
  const table = document.createElement('table');

  // Create table header row
  const headerRow = document.createElement('tr');
  ['Complete?', 'ID', 'Customer Name', 'Description', 'Order Notes', 'Delivery', 'Promised Time', 'Status', 'Paid', 'Date'].forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Populate table with order data
  orders.forEach(order => {
    const row = document.createElement('tr');

    // Create cell for completion status
    const completionCell = document.createElement('td');
    const completionCheckbox = document.createElement('input');
    completionCheckbox.type = 'checkbox';
    completionCheckbox.addEventListener('change', () => {
      if (completionCheckbox.checked) {
        row.classList.add('completed');
        markedOrders.push(order.id);
        markAsCompleteBtn.disabled = false;
      } else {
        row.classList.remove('completed');
        markedOrders = markedOrders.filter(id => id !== order.id);
        if (markedOrders.length === 0) {
          markAsCompleteBtn.disabled = true;
        }
      }
    });
    completionCell.appendChild(completionCheckbox);
    row.appendChild(completionCell);

    // Add other cells for order data
    Object.entries(order).forEach(([key, value]) => {
      const cell = document.createElement('td');
      if (key === 'date') {
        cell.textContent = formatDate(value); // Format the date
      } else {
        cell.textContent = value;
      }
      row.appendChild(cell);
    });

    table.appendChild(row);
  });

  // Create a div for table container
  const tableContainer = document.createElement('div');
  tableContainer.classList.add('table-container');
  tableContainer.appendChild(table);

  // Append table to orders container
  ordersContainer.appendChild(tableContainer); // Append the table container instead of the table directly
};

// Function to fetch and render pending orders
const fetchPendingOrders = () => {
  fetch(`/api/orders/status-pending`)
    .then(response => response.json())
    .then(orders => renderOrders(orders, 'pending'))
    .catch(err => console.error(err));
};

// Fetch and render pending orders by default
fetchPendingOrders();

select.addEventListener('change', e => {
  const status = e.target.value;

  if (status === 'Select an option') {
    // If "Select an option" is selected, do nothing
    return;
  }

  fetch(`/api/orders/status-${status}`)
    .then(response => response.json())
    .then(orders => renderOrders(orders, status))
    .catch(err => console.error(err));
});