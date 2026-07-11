// To hide and show the username and input box respectiverly
function hideStuff() {
  if (document.getElementById("changeform").classList.contains("d-flex")) {
    document.getElementById("changeform").classList.remove("d-flex");
    document.getElementById("changeform").classList.add("d-none");

    document.getElementById("username").classList.remove("d-none");
    document.getElementById("username").classList.add("d-block");
  } else {
    document.getElementById("changeform").classList.remove("d-none");
    document.getElementById("changeform").classList.add("d-flex");

    document.getElementById("username").classList.remove("d-block");
    document.getElementById("username").classList.add("d-none");
  }
}

function copylink(copybtn) {
  linkcpy = copybtn.getAttribute("data-link");
  navigator.clipboard.writeText(linkcpy).then(() => {
    copybtn.innerHTML = "<i class='bi bi-link-45deg'></i>Copied!";
    setTimeout(() => {
      copybtn.innerHTML = "<i class='bi bi-link-45deg'></i>Copy link to share!";
    }, 2000);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // The overall rating of the person
  rating = document.getElementById("rating").innerHTML;
  document.getElementById("rating-circle").style.background =
    `conic-gradient(#198754 ${rating}%, rgba(255,255,255,0.1) 0)`;
  rating_popover = document.getElementById("rating_popover");
  rating_popover = bootstrap.Popover.getOrCreateInstance(rating_popover);
  if (rating > 90) {
    rating_popover.setContent({
      ".popover-body": "Safe to say, all your takes are just FACTS!",
    });
  } else if (rating > 65) {
    rating_popover.setContent({
      ".popover-body": "Not everyone agrees but your takes are still valid!",
    });
  } else if (rating > 50) {
    rating_popover.setContent({
      ".popover-body": "Not bad Not good either, you got some hot takes!",
    });
  } else if (rating > 30) {
    rating_popover.setContent({
      ".popover-body": "People are not agreeing with you, are you LARPing?",
    });
  } else if (rating > 0) {
    rating_popover.setContent({
      ".popover-body": "Alright my friend, stop trolling and lock in!",
    });
  } else {
    rating_popover.setContent({
      ".popover-body": "You gotta start some where :)",
    });
  }
  // The rating of the lists he created
  comment_popover = document.getElementsByName("comment-popover");
  comment_popover.forEach((element) => {
    popover = bootstrap.Popover.getOrCreateInstance(element);

    comment_rating = element.children[0];
    rating = comment_rating.getAttribute("data-bs-rating");
    if (rating > 90) {
      popover.setContent({ ".popover-body": "Goated list honestly" });
    } else if (rating > 65) {
      popover.setContent({ ".popover-body": "Still a real good list" });
    } else if (rating > 45) {
      popover.setContent({
        ".popover-body": "Some real hot takes in this list",
      });
    } else if (rating > 30) {
      popover.setContent({ ".popover-body": "Is this a LARP list?" });
    } else if (rating > 0) {
      popover.setContent({ ".popover-body": "Trolling ahh list" });
    } else {
      popover.setContent({ ".popover-body": "Share it with more people :)" });
    }
    comment_rating.style.background = `conic-gradient(#198754 ${rating}%, rgba(255,255,255,0.1) 0)`;
  });
});
