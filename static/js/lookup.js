// Username entry -> POST /api/join/lookup on Hall-Monitor via nginx proxy.
// Response drives whether the role picker + code display appear.

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lookup-form");
  const result = document.getElementById("lookup-result");
  const picker = document.getElementById("role-picker");
  const codeBox = document.getElementById("code-display");

  // Visibility is the `hidden` attribute (see layouts/join/single.html), so the
  // markup still makes sense with CSS disabled.
  const setResult = (text, state) => {
    result.textContent = text;
    result.classList.toggle("is-error", state === "error");
    result.classList.toggle("is-ok", state === "ok");
  };

  // Every failure path has to re-hide the picker: without this, looking up an
  // eligible name and then an ineligible one leaves the first name's role
  // checkboxes and code on screen, attached to a lookup that no longer holds.
  const reject = (message) => {
    picker.hidden = true;
    codeBox.hidden = true;
    delete window.__hallwayLookup;
    setResult(message, "error");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    if (!username) return;

    setResult("Looking you up…", null);
    try {
      const response = await fetch(
        `/api/join/lookup?username=${encodeURIComponent(username)}`,
      );
      if (response.status === 404) {
        reject("That username isn't a Minecraft account we could find.");
        return;
      }
      if (!response.ok) {
        reject("Something went wrong. Try again in a minute.");
        return;
      }
      const data = await response.json();
      if (!data.eligible) {
        // Each reason gets its own sentence. The fallback below is only
        // right for "not chief or owner" — telling an expelled guild's
        // chief they don't lead a major guild is both wrong and
        // maddening, since they do.
        if (data.reason === "guild expelled" && data.guild_tag) {
          reject(`${data.guild_tag} has been removed from the Guild Hall, so its representatives can't join. If you think that's a mistake, a Hall monitor can look at it.`);
        } else if (data.reason === "guild not major" && data.guild_tag) {
          reject(`You lead ${data.guild_tag}, but ${data.guild_tag} isn't currently a major guild.`);
        } else {
          reject("You're not currently chief or owner of a major guild.");
        }
        return;
      }
      setResult(`Verified as a representative of ${data.guild_tag}. Pick your role(s):`, "ok");
      picker.hidden = false;
      codeBox.hidden = false;
      window.__hallwayLookup = data;
      window.dispatchEvent(new Event("hallway:lookup"));
    } catch (err) {
      reject("Something went wrong. Try again in a minute.");
    }
  });
});
