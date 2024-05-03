// Get references to the modal and the button to open it
const modalForm = document.getElementById('modal-form');
const openModalButton = document.getElementById('open-modal-btn');
const form = document.querySelector('form')
const custName = document.querySelector('[name=customer_name]');
const description = document.querySelector('[name=description]');
const orderNotes = document.querySelector('[name=order_notes]');
const delivery = document.querySelector('[name=delivery]');
const promisedTime = document.querySelector('[name=promised_time]');
const status = document.querySelector('[name=status]');
const payment = document.querySelector('[name=payment]');

// Function to toggle modal visibility
function toggleModal() {
  modalForm.style.display = modalForm.style.display === 'none' ? 'block' : 'none';
}

// Add event listener to the button to toggle modal visibility
openModalButton.addEventListener('click', toggleModal);

// Function to close the modal when the close button is clicked
function closeModal() {
  modalForm.style.display = 'none';
}

// Get reference to the close button
const closeButton = document.querySelector('.close');

// Add event listener to the close button to close the modal
closeButton.addEventListener('click', closeModal);

// Close the modal when user clicks outside of it
window.addEventListener('click', function(event) {
  if (event.target === modalForm) {
    toggleModal();
  }
});

// Function to format time in 12-hour AM/PM format
function formatAMPM(date, meridian) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = meridian ? meridian.toLowerCase() : (hours >= 12 ? 'pm' : 'am');
  const formattedHours = hours % 12 || 12; // Convert 0 to 12
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

// Function to lowercase meridian before parsing into JSON
function formatMeridian(meridian) {
  return meridian.toLowerCase();
}

// Function to handle form submission
const handleSubmit = (e) => {
  e.preventDefault();

  // Set default values for status and payment
  const defaultStatus = 'pending';
  const defaultPayment = 'pending';

  // Explicitly set status and payment values
  document.querySelector('[name=status]').value = defaultStatus;
  document.querySelector('[name=payment]').value = defaultPayment;

  // Convert the selected date to ISO string format
  const selectedDate = new Date(document.getElementById('date').value);
  const selectedHours = document.getElementById('hours').value;
  const selectedMinutes = document.getElementById('minutes').value;
  const selectedMeridian = document.querySelector('[name=meridian]').value;
  
  // Validate hours and minutes
  if (selectedHours < 1 || selectedHours > 12 || selectedMinutes < 0 || selectedMinutes > 59) {
    alert("Please enter a valid time.");
    return;
  }

  // Format the time
  const formattedTime = `${selectedHours}:${selectedMinutes} ${formatMeridian(selectedMeridian)}`;


  // Create newOrder object with form values
  const newOrder = {
    customer_name: custName.value,
    description: description.value,
    order_notes: orderNotes.value,
    delivery: delivery.checked ? 'yes' : 'no',
    promised_time: formattedTime,
    status: defaultStatus,
    payment: defaultPayment,
    date: selectedDate.toISOString(),
  };

  // Send POST request to server with newOrder data
  fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newOrder),
  })
    .then((response) => response.json())
    .then((order) => {
      // Redirect to current page after successful submission
      window.location.replace(window.location.href);
    })
    .catch((err) => console.log(err));
};

// Add submit event listener to the form
form.addEventListener('submit', handleSubmit);
