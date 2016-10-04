import React from 'react';

export function Page(props: any) {
  return (
    <div className="Page">
      {props.children}
    </div>
  );
}

export function PageSpinner(props: any) {
  return (
    <div className="PageSpinner">
    </div>
  )
}