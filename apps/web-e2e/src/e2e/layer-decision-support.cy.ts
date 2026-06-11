describe('layer decision support', () => {
  const keycloakOrigin = 'http://127.0.0.1:8080';

  const authUser = {
    username: Cypress.env('KEYCLOAK_E2E_USERNAME') || 'cypress',
    password: Cypress.env('KEYCLOAK_E2E_PASSWORD') || 'cypress',
  };

  const visitWorkbench = () => {
    cy.intercept('GET', '**tile.openstreetmap.org/**', {
      statusCode: 204,
    });
    cy.visit('/');
  };

  const assertViewportFit = () => {
    cy.get('aside[aria-label="Sökning och lagerstyrning"]').then(($panel) => {
      cy.get('section[aria-labelledby="property-heading"]').then(($card) => {
        cy.get('div[aria-label="Kartreglage"]').then(($zoom) => {
          cy.window().then((win) => {
            const panel = $panel[0].getBoundingClientRect();
            const card = $card[0].getBoundingClientRect();
            const zoom = $zoom[0].getBoundingClientRect();
            const overlapsPanel =
              zoom.left < panel.right &&
              zoom.right > panel.left &&
              zoom.top < panel.bottom &&
              zoom.bottom > panel.top;

            expect(win.document.documentElement.scrollWidth).to.be.at.most(win.innerWidth + 1);
            expect(panel.right).to.be.at.most(win.innerWidth + 1);
            expect(panel.bottom).to.be.at.most(win.innerHeight + 1);
            expect(card.bottom).to.be.at.most(win.innerHeight + 1);
            expect(overlapsPanel).to.equal(false);
          });
        });
      });
    });

    cy.get('canvas').should('have.length.at.least', 1);
    cy.contains('Planlinjer').should('not.exist');
  };

  const signInWithKeycloak = () => {
    cy.contains('button', 'Behörighet').click();

    cy.origin(keycloakOrigin, { args: authUser }, ({ username, password }) => {
      cy.get('#username', { timeout: 15_000 }).type(username);
      cy.get('#password').type(password, { log: false });
      cy.get('#kc-login').click();
    });

    cy.location('port', { timeout: 20_000 }).should('eq', '4200');
    cy.get('div[aria-label="Användarkonto"]')
      .find('button[aria-label="Användare: Metria Cypress"]')
      .should('be.visible');
  };

  it('supports layer selection while keeping restricted imagery unavailable without access', () => {
    visitWorkbench();

    cy.contains('Skyddad flygbild').closest('mat-card').as('imageryCard');
    cy.get('@imageryCard').should('contain.text', 'Kräver roll: restricted-geodata');
    cy.get('@imageryCard').find('input[type="checkbox"]').should('be.disabled');

    cy.contains('Klimatriskzoner').closest('mat-card').as('climateCard');
    cy.get('@climateCard').find('input[type="checkbox"]').uncheck({ force: true });
    cy.contains('1 lager');
    cy.get('@climateCard').find('input[type="checkbox"]').check({ force: true });
    cy.contains('2 lager');
  });

  it('enables restricted layers after Keycloak sign-in', () => {
    visitWorkbench();
    signInWithKeycloak();

    cy.contains('Skyddad flygbild').closest('mat-card').as('imageryCard');
    cy.get('@imageryCard').find('input[type="checkbox"]').should('not.be.disabled');
    cy.get('@imageryCard').find('input[type="checkbox"]').check({ force: true });
    cy.contains('3 lager');
  });

  it('moves the map context when searching for Stockholm', () => {
    visitWorkbench();

    cy.get('input[aria-label="Sök fastighet, adress eller ort"]').clear().type('Stockholm');
    cy.contains('button', 'Sök').click();

    cy.contains('h1', 'Stockholm').should('be.visible');
    cy.contains('N 59.3293, E 18.0686 WGS84');
    cy.contains('Träff vald');
  });

  it('keeps the map workspace usable across desktop and narrow viewports', () => {
    [
      [914, 776],
      [700, 720],
      [390, 844],
    ].forEach(([width, height]) => {
      cy.viewport(width, height);
      visitWorkbench();

      assertViewportFit();
    });
  });
});
