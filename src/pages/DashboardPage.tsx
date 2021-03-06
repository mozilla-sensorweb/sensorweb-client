import React from 'react';
import { Page, PageHeader, PageContent } from '../ui';
import { NavigationState } from '../state';

export default function DashboardPage(props: { nav: NavigationState }) {
  return <Page>
    <PageContent>
      <iframe src="https://google.com" style={{
        width: '100%',
        height: '100%',
        border: 0
      }} />
    </PageContent>
  </Page>;
}