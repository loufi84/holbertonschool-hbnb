document.addEventListener('DOMContentLoaded', async () => {
    // Rating display
    const ratingContainer = document.getElementById('rating-container');
    const ratingStr = ratingContainer.getAttribute('data-rating');
    const rating = ratingStr ? parseFloat(ratingStr) : null;

    if (rating === null) {
        ratingContainer.innerHTML = '<p>No rating for the moment</p>';
    } else {
        const maxRating = 5;
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let ratingHTML = '<div class="rating">';
        for (let i = 1; i <= maxRating; i++) {
            if (i <= fullStars) {
                ratingHTML += '<i class="fa fa-star star filled"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                ratingHTML += '<i class="fa fa-star-half-alt star filled"></i>';
            } else {
                ratingHTML += '<i class="fa fa-star star"></i>';
            }
        }
        ratingHTML += `<span class="score">${rating}/5</span></div>`;
        ratingContainer.innerHTML = ratingHTML;
    }
});
