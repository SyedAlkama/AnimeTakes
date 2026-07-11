document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("subs-btn").addEventListener("click", function () {
    username = document.getElementById("namebox").value;
    submit_btn = document.getElementById("subs-btn");
    list_id = submit_btn.getAttribute("data-table");

    if (username > 60) {
      // If any error happens during the above block, show the error
      console.error("cant fetch data", error);
      document.body.innerHTML = "<h1> Some HTML error occurred</h1>";
    }

    tiers = document.querySelectorAll(".tier-drop");
    tierdata = {};

    tiers.forEach((tier) => {
      tierdata[tier.id] = [];
      singleobj = {};
      Array.from(tier.children).forEach((element) => {
        singleobj["mal_id"] = element.id;
        singleobj["img"] = element.firstElementChild.src;
        singleobj["name"] = element.getAttribute("data-bs-title");
        tierdata[tier.id].push(singleobj);
        singleobj = {};
      });
    });

    tierdata["list_id"] = list_id;
    tierdata["username"] = username;

    fetch("/createsubs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tierdata),
    }).then((resp) => {
      window.location.href = resp.url;
    });
  });

  // const for sortable js shared groups
  const sharedgroup = "tier-list-items";
  // get all the drop zones of each tier
  const tierDropZones = document.querySelectorAll(".tier-drop");

  let counter = 0;

  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]',
  );
  const tooltipList = [...tooltipTriggerList].map(
    (el) => new bootstrap.Tooltip(el),
  );

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
      scrollSpeed:25,
      forceAutoScrollFallback: true,

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
    scrollSpeed:25,
    forceAutoScrollFallback: true,

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

  function countelements() {
    counter = document.querySelectorAll(".tier-drop img").length;
  }

  document
    .getElementById("submit-button")
    .addEventListener("click", function () {
      warning_modal = document.getElementById("warning-modal");
      submit_modal = document.getElementById("submit-modal");
      count_inpool = document.querySelectorAll(".item-pool div").length;
      let allinone = false;
      if (count_inpool != 0) {
        document.getElementById("exampleModalLabel").innerHTML =
          "Please rank all the items!";
        bootstrap.Modal.getOrCreateInstance(warning_modal).toggle();
      } else if (document.getElementById("namebox").value == "") {
        document.getElementById("exampleModalLabel").innerHTML =
          "Tell us your name friend!!";
        bootstrap.Modal.getOrCreateInstance(warning_modal).toggle();
      } else {
        alltiers = document.querySelectorAll(".tier-drop");
        alltiers.forEach((tier) => {
          if (tier.childElementCount == counter) {
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
