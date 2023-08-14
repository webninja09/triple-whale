const newsCards = document.querySelectorAll("[fd-custom-code='newsCard']");

const latestCards = document.querySelectorAll("[fd-custom-code='latestCard']");

latestCards.forEach((card, index) => {
  const newsCard = newsCards[index];
  const url = newsCard.getAttribute("href");
  const imgSrc = newsCard
    .querySelector("[fd-custom-code='featuredImage']")
    .getAttribute("src");

  // ----- setting outer attributes starts here ---------
  // changing  heading
  card.querySelector(
    "[fd-custom-code='heading-out']"
  ).innerHTML = newsCard.querySelector("[fd-custom-code='heading']").innerHTML;
  // changing the  category
  card.querySelector(
    "[fd-custom-code='category-out']"
  ).innerHTML = newsCard.querySelector("[fd-custom-code='category']").innerHTML;
  // setting the  image source
  card
    .querySelector("[fd-custom-code='image-out']")
    .setAttribute("src", imgSrc);

  // setting  image ssrcset
  card
    .querySelector("[fd-custom-code='image-out']")
    .setAttribute("srcset", imgSrc);
  // ----- setting outer attributes ends here ---------

  // ------------setting hover state attributes starts here ---------
  // setting link
  card.querySelector("[fd-custom-code='blog-link']").setAttribute("href", url);
  // setting image
  card
    .querySelector("[fd-custom-code='featuredImage']")
    .setAttribute("src", imgSrc);
  // setting heading
  card.querySelector(
    "[fd-custom-code='heading']"
  ).innerHTML = newsCard.querySelector("[fd-custom-code='heading']").innerHTML;
  // setting description
  card.querySelector(
    "[fd-custom-code='description']"
  ).innerHTML = newsCard.querySelector(
    "[fd-custom-code='description']"
  ).innerHTML;
  // setting category
  card.querySelector(
    "[fd-custom-code='category']"
  ).innerHTML = newsCard.querySelector("[fd-custom-code='category']").innerHTML;
});
