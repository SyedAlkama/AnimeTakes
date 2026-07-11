// Reveal the list from the blur
revealbtn = document.getElementById("reveal");
revealbtn.addEventListener("click", function () {
  document.getElementById("tierlist").style = "";
});

document.addEventListener("DOMContentLoaded", () => {
  // Score given by all the comments
  rating_popover = document.getElementsByName("rating-popover");
  rating_popover.forEach((element) => {
    popover = bootstrap.Popover.getOrCreateInstance(element);

    rating_circle = element.children[0];
    rating = rating_circle.getAttribute("data-bs-rating");
    if (rating > 90) {
      popover.setContent({ ".popover-body": "Agrees with the list heavy" });
    } else if (rating > 65) {
      popover.setContent({
        ".popover-body": "Thinking alike, but where do they differ?",
      });
    } else if (rating > 45) {
      popover.setContent({ ".popover-body": "Its kinda 50-50 i think" });
    } else if (rating > 30) {
      popover.setContent({ ".popover-body": "Calling it a LARP list" });
    } else if (rating > 0) {
      popover.setContent({ ".popover-body": "called it a TRASH LIST" });
    } else {
      popover.setContent({ ".popover-body": "Is this even possible XD" });
    }
    rating_circle.style.background = `conic-gradient(#198754 ${rating}%, rgba(255,255,255,0.1) 0)`;
  });

  // The overall rating of the whole list
  listCircle = bootstrap.Popover.getOrCreateInstance(
    document.getElementById("listCircle"),
  );

  listrating = document.getElementById("listCircle").children[0];
  rating = listrating.getAttribute("data-bs-rating");
  if (rating > 90) {
    listCircle.setContent({ ".popover-body": "Goated list honestly" });
  } else if (rating > 65) {
    listCircle.setContent({ ".popover-body": "Still a real good list" });
  } else if (rating > 45) {
    listCircle.setContent({
      ".popover-body": "Some real hot takes in this list",
    });
  } else if (rating > 30) {
    listCircle.setContent({ ".popover-body": "Is this a LARP list?" });
  } else if (rating > 0) {
    listCircle.setContent({ ".popover-body": "Trolling ahh list" });
  } else {
    listCircle.setContent({ ".popover-body": "Share it with more people :)" });
  }
  listrating.style.background = `conic-gradient(#198754 ${rating}%, rgba(255,255,255,0.1) 0)`;
});
