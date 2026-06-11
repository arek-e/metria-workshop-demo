describe('layer decision support', () => {
  const visitWorkbench = () => {
    cy.intercept('GET', '**tile.openstreetmap.org/**', {
      statusCode: 204,
    });
    cy.visit('/?auth=disabled');
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

  it('renders the current account avatar without the removed permission button', () => {
    visitWorkbench();

    cy.get('div[aria-label="Användarkonto"]')
      .find('button[aria-label="Autentiserar"]')
      .should('be.visible')
      .and('be.disabled');
    cy.contains('button', 'Behörighet').should('not.exist');
  });

  it('supports layer selection while keeping restricted imagery unavailable without access', () => {
    visitWorkbench();

    cy.contains('Skyddad flygbild').closest('mat-card').as('imageryCard');
    cy.get('@imageryCard').find('input[type="checkbox"]').should('be.disabled');

    cy.contains('Klimatriskzoner').closest('mat-card').as('climateCard');
    cy.get('@climateCard').find('input[type="checkbox"]').uncheck({ force: true });
    cy.get('div[aria-label*="synliga lager: Fastighetsgränser"]').should('exist');
    cy.get('@climateCard').find('input[type="checkbox"]').check({ force: true });
    cy.get('div[aria-label*="synliga lager: Fastighetsgränser, Klimatriskzoner"]').should('exist');
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
