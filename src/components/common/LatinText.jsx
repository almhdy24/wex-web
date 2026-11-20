import React from 'react';

/**
 * LatinText wraps Latin/English text (like product names, specs, models)
 * in <bdi dir="ltr"> so that in an RTL Arabic interface, punctuation,
 * quotes, and hyphens never flip incorrectly.
 */
export default function LatinText({ children, className }) {
  if (children === null || children === undefined || children === '') {
    return null;
  }
  return (
    <bdi dir="ltr" {...(className ? { className } : {})}>
      {children}
    </bdi>
  );
}
