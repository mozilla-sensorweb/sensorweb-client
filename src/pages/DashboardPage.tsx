import React from 'react';
import { Page, PageHeader, PageContent } from '../ui';
import { NavigationState } from '../state';

export default function DashboardPage(props: { nav: NavigationState }) {
  return <Page>
    <PageContent>
      <section className="instruction">
        <p>Connected!</p>
      </section>
    </PageContent>
  </Page>;
}