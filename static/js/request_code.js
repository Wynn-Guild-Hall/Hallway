// Watches the role checkboxes and updates the live `HALL<NN>` code display.
// The digits are a bit-field over the ticked roles (see role_bits.py in
// Hall-Monitor for the canonical bit assignments), zero-padded to two so
// the code is the same six characters as a dazebot account-link code.
// Mirrors mc_command.format_code on the Hall-Monitor side.

document.addEventListener("DOMContentLoaded", () => {
  const picker = document.getElementById("role-picker");
  const codeLine = document.getElementById("code-line");
  const conflictBox = document.getElementById("conflict-warnings");

  const recompute = () => {
    let bits = 0;
    picker.querySelectorAll("input[type=checkbox]:checked").forEach((el) => {
      bits |= 1 << Number(el.dataset.bit);
    });
    codeLine.textContent = `HALL${String(bits).padStart(2, "0")}`;

    // Surface conflict warnings for any ticked role currently held by someone else.
    const lookup = window.__hallwayLookup;
    if (!lookup) return;
    const contacts = lookup.current_contacts_per_role || {};
    const warnings = [];
    picker.querySelectorAll("input[type=checkbox]:checked").forEach((el) => {
      const role = el.value;
      const holder = contacts[role];
      if (holder) {
        warnings.push(`${lookup.guild_tag}'s ${role} contact is currently ${holder} — verifying will take that role from them.`);
      }
    });
    conflictBox.innerHTML = warnings.map((w) => `<p class="orange">${w}</p>`).join("");
  };

  picker.addEventListener("change", recompute);
  window.addEventListener("hallway:lookup", recompute);
});
