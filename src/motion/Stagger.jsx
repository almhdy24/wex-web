import React from 'react';
import styles from './Stagger.module.css';

/**
 * <Stagger>
 * Injects index CSS custom variable `--i` onto each direct child,
 * orchestrating a fluid cascading entrance animation.
 */
export default function Stagger({ children, className = '', as: Component = 'div', ...rest }) {
  const childArray = React.Children.toArray(children);

  return (
    <Component className={`${styles.stagger} ${className}`.trim()} {...rest}>
      {childArray.map((child, index) => {
        if (!React.isValidElement(child)) return child;

        const childStyle = {
          ...child.props.style,
          '--i': index,
        };

        return React.cloneElement(child, {
          style: childStyle,
        });
      })}
    </Component>
  );
}
