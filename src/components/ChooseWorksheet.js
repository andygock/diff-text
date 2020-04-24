import { Button, Classes, Dialog } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import React from 'react';

const ChooseWorksheet = ({ sheets, onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <Dialog isOpen={isOpen}>
      <div className={Classes.DIALOG_BODY}>
        <h3>More than one worksheet detected, choose one:</h3>
        {sheets.map((name, index) => (
          <Button
            key={index}
            fill
            minimal
            onClick={(e) => {
              onSelect(e.target.name);
              setIsOpen(false);
            }}
            name={name}
          >
            {name}
          </Button>
        ))}
      </div>
    </Dialog>
  );
};

ChooseWorksheet.propTypes = {
  sheets: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func,
};

ChooseWorksheet.defaultProps = {
  sheets: [],
  onSelect: () => false,
};

export default ChooseWorksheet;
