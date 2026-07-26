// Username entry -> POST /api/join/lookup on Hall-Monitor via nginx proxy.
// Response drives whether the role picker + code display appear.

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lookup-form");
  const result = document.getElementById("lookup-result");
  const picker = document.getElementById("role-picker");
  const codeBox = document.getElementById("code-display");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    if (!username) return;

    result.textContent = "Looking you up…";
    try {
      const response = await fetch(
        `/api/join/lookup?username=${encodeURIComponent(username)}`,
      );
      if (response.status === 404) {
        result.textContent = "That username isn't a Minecraft account we could find.";
        return;
      }
      if (!response.ok) {
        result.textContent = "Something went wrong. Try again in a minute.";
        return;
      }
      const data = await response.json();
      if (!data.eligible) {
        if (data.reason === "guild not notable" && data.guild_tag) {
          result.textContent = `You lead ${data.guild_tag}, but ${data.guild_tag} isn't currently a notable guild.`;
        } else {
          result.textContent = "You're not currently chief or owner of a notable guild.";
        }
        return;
      }
      result.textContent = `Verified as a representative of ${data.guild_tag}. Pick your role(s):`;
      picker.classList.remove("dn");
      codeBox.classList.remove("dn");
      window.__hallwayLookup = data;
      window.dispatchEvent(new Event("hallway:lookup"));
    } catch (err) {
      result.textContent = "Something went wrong. Try again in a minute.";
    }
  });
});
