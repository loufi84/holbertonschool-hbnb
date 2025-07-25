document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.star-rating input');
    const ratingInput = document.querySelector('#review-rating-value');
  
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        ratingInput.value = input.value;
        console.log("Note sélectionnée :", input.value);
      });
    });
  });
  