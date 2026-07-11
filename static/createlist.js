// The code has been written by taking references from the docs of Jikan and Sortable JS
// Gemini AI has been used to undertand many parts of the docs and the implmentation
// The code is written entirely by me

document.addEventListener("DOMContentLoaded", () => {
  // const for sortable js shared groups
  const sharedgroup = "tier-list-items";
  // get all the drop zones of each tier
  const tierDropZones = document.querySelectorAll(".tier-drop");

  let count = 0;

  // Make the drop zones sortable
  tierDropZones.forEach((zone) => {
    new Sortable(zone, {
      group: sharedgroup,
      animation: 150,
      ghostClass: "opacity-50",

      //For the scroll
      scroll: true,
      bubbleScroll: true,
      delay: 100,
      delayOnTouchOnly: true,
      forceFallback: true,
      fallbackClass: "sortable-fallback",
      scrollSensitivity: 100,

      // When drag disable the tooltip, When placed enable it again
      onStart: function (evt) {
        countelements();
        const item = evt.item;
        const tooltip = bootstrap.Tooltip.getInstance(item);

        if (tooltip) {
          tooltip.hide();
          tooltip.disable();
        }
      },
      onEnd: function (evt) {
        countelements();
        const item = evt.item;
        const tooltip = bootstrap.Tooltip.getInstance(item);

        if (tooltip) {
          tooltip.enable();
        }
      },
    });
  });

  // Make the item pool sortable
  const itempool = document.getElementById("item-pool");
  new Sortable(itempool, {
    group: sharedgroup,
    animation: 150,

    //For the scroll
    scroll: true,
    bubbleScroll: true,
    delay: 100,
    delayOnTouchOnly: true,
    forceFallback: true,
    fallbackClass: "sortable-fallback",
    scrollSensitivity: 100,

    onStart: function (evt) {
      const item = evt.item;
      const tooltip = bootstrap.Tooltip.getInstance(item);

      if (tooltip) {
        tooltip.hide();
        tooltip.disable();
      }
    },
    onEnd: function (evt) {
      countelements();
      const item = evt.item;
      const tooltip = bootstrap.Tooltip.getInstance(item);

      if (tooltip) {
        tooltip.enable();
      }
    },
  });

  // Function to search when button is clicked
  document.getElementById("searchitems").addEventListener("click", async function (e) {
      e.preventDefault();
      // Get the data entered
      const template = document.getElementById("template").value;
      const query = document.getElementById("query").value;
      if(query.trim().length === 0){
        return;
      }
      // Start the spinner 
      document.getElementById("searchitems").disabled = true;
      const spinner = document.getElementById("loadingspinner");
      spinner.classList.toggle("d-none");
      // Empty the itempool if it has anything
      itempool.innerHTML = "";

      const datatosend = {
        query: query,
        template: template,
      };

      try {
        // Send the search data via POST, and wait for the coming results data
        const response = await fetch("/search", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify(datatosend),
        });
        // If cant get response, throw error
        if (!response.ok) {
          throw new Error(
            `HTTP error couldnt get response! ${response.status}`,
          );
        }
        // Turn the json data into an object
        const data = await response.json();

        //Iterate through the data and create the html tags for each one

        data.forEach((tag) => {
          // For the image
          const newimg = document.createElement("img");
          newimg.src = tag["image"];
          newimg.classList.add("tier-item", "rounded");

          //For the tooltip as a span tag
          const wrapper = document.createElement("div");
          wrapper.id = tag["mal_id"];
          wrapper.setAttribute("data-bs-toggle", "tooltip");
          if (template == "anime" || template == "manga") {
            wrapper.setAttribute("data-bs-title", tag["title"]);
          } else {
            wrapper.setAttribute("data-bs-title", tag["name"]);
          }

          wrapper.appendChild(newimg);
          itempool.appendChild(wrapper);
        });
        spinner.classList.toggle("d-none");
        // Tell bootrap, here are all the tooltips
        const tooltipTriggerList = document.querySelectorAll(
          '[data-bs-toggle="tooltip"]',
        );
        const tooltipList = [...tooltipTriggerList].map(
          (el) => new bootstrap.Tooltip(el),
        );
        document.getElementById("searchitems").disabled = false;
      } catch (error) {
        // If any error happens during the above block, show the error
        console.error("cant fetch data", error);
        document.body.innerHTML =
          "<h1> Some API error occured ( It must be down try again later.)</h1>";
      }
    });

  function countelements() {
    count = document.querySelectorAll(".tier-drop img").length;
    let counterbox = document.getElementById("counter");
    counterbox.innerHTML = `${count} / 30`;

    if (count >= 30) {
      counterbox.style.color = "#e6584e";
      counterbox.innerHTML = `30 / 30 (MAX ELEMENTS REACHED!)`;
    }
  }

  document.getElementById("submit-button").addEventListener("click", function () {
      warning_modal = document.getElementById("warning-modal");
      submit_modal = document.getElementById("submit-modal");
      let allinone = false;
      if (count < 4) {
        document.getElementById("exampleModalLabel").innerHTML =
          "You need atleast four element to submit!";
        bootstrap.Modal.getOrCreateInstance(warning_modal).toggle();
      } else if (document.getElementById("inputbox").value == "") {
        document.getElementById("exampleModalLabel").innerHTML =
          "Title is required my friend!!";
        bootstrap.Modal.getOrCreateInstance(warning_modal).toggle();
      } else if (count >= 30) {
        document.getElementById("exampleModalLabel").innerHTML =
          "Exceeded the max element count for the Tierlist!";
        bootstrap.Modal.getOrCreateInstance(warning_modal).toggle();
      } else {
        alltiers = document.querySelectorAll(".tier-drop");
        alltiers.forEach((tier) => {
          if (tier.childElementCount == count) {
            document.getElementById("exampleModalLabel").innerHTML =
              "Can't put all your baskets in one egg!";
            bootstrap.Modal.getOrCreateInstance(warning_modal).toggle();
            allinone = true;
          }
        });
        if (!allinone) {
          bootstrap.Modal.getOrCreateInstance(submit_modal).toggle();
        }
      }
    });
});

document.getElementById("createListBtn").addEventListener("click",function() {
  document.getElementById("createListBtn").disabled = true;
  document.getElementById("createListBtn").textContent = "Processing...";
  title = document.getElementById("inputbox").value;
  description = document.getElementById("descriptionbox").value;
  category = document.getElementById("template").value;

  if (title.length > 110 || title.length < 1 || description.length > 650) {
    document.body.innerHTML ="<h1> Someone messed with the HTML. Please go back and try again.</h1>";
  }

  tiers = document.querySelectorAll(".tier-drop");
  tierdata = {};

  tiers.forEach((tier) => {
    tierdata[tier.id] = [];
    singleobj = {};
    tier.childNodes.forEach((element) => {
      singleobj["mal_id"] = element.id;
      singleobj["img"] = element.firstElementChild.src;
      singleobj["name"] = element.getAttribute("data-bs-title");
      tierdata[tier.id].push(singleobj);
      singleobj = {};
    });
  });
  tierdata["title"] = title;
  tierdata["description"] = description;
  tierdata["category"] = category;

  fetch("/createlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tierdata),
  }).then((resp) => {
    window.location.href = resp.url;
  });
});
