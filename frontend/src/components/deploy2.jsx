import React, { useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const gridSize = 10;
const ItemTypes = { SHIP: "ship" };

const shipTypes = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 }
];

function Ship({ ship, index, isUsed }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SHIP,
    item: { index },
    canDrag: !isUsed,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }), [isUsed]);

  return (
    <button
      ref={drag}
      disabled={isUsed}
      className={`text-white text-xs p-2 rounded border shadow-md ${
        isUsed ? "bg-gray-500 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-600 border-white"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {ship.size}X
    </button>
  );
}

function Cell({ x, y, grid, handleDrop }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.SHIP,
    drop: (item) => handleDrop(item.index, x, y),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }), [grid]);

  return (
    <div
      ref={drop}
      className={`w-8 h-8 border bg-blue-400 flex items-center justify-center text-xs text-white cursor-pointer ${
        grid[y][x] ? "bg-green-600" : isOver ? "bg-blue-600" : ""
      }`}
    >
      {grid[y][x] ? "🚢" : ""}
    </div>
  );
}

export default function Deploy2() {
  const [grid, setGrid] = useState(
    Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null))
  );
  const [isVertical, setIsVertical] = useState(false);
  const [usedShips, setUsedShips] = useState(Array(shipTypes.length).fill(false));

  const canPlaceShip = (grid, x, y, size, isVertical) => {
    for (let i = 0; i < size; i++) {
      const xi = isVertical ? x : x + i;
      const yi = isVertical ? y + i : y;
      if (xi >= gridSize || yi >= gridSize || grid[yi][xi]) return false;
    }
    return true;
  };

  const placeShip = (grid, x, y, size, name, isVertical) => {
    for (let i = 0; i < size; i++) {
      const xi = isVertical ? x : x + i;
      const yi = isVertical ? y + i : y;
      grid[yi][xi] = name;
    }
  };

  const handleDrop = (shipIndex, x, y) => {
    if (usedShips[shipIndex]) return;
    const newGrid = [...grid.map(row => [...row])];
    const shipSize = shipTypes[shipIndex].size;
    let canPlace = canPlaceShip(newGrid, x, y, shipSize, isVertical);

    if (canPlace) {
      placeShip(newGrid, x, y, shipSize, shipTypes[shipIndex].name, isVertical);
      const updatedUsedShips = [...usedShips];
      updatedUsedShips[shipIndex] = true;
      setUsedShips(updatedUsedShips);
      setGrid(newGrid);
    } else {
      alert("Cannot place ship here.");
    }
  };

  const autoPlaceShips = () => {
    let newGrid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));
    let updatedUsedShips = Array(shipTypes.length).fill(false);

    shipTypes.forEach((ship, index) => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 1000) {
        const randomX = Math.floor(Math.random() * gridSize);
        const randomY = Math.floor(Math.random() * gridSize);
        const vertical = Math.random() < 0.5;
        if (canPlaceShip(newGrid, randomX, randomY, ship.size, vertical)) {
          placeShip(newGrid, randomX, randomY, ship.size, ship.name, vertical);
          updatedUsedShips[index] = true;
          placed = true;
        }
        attempts++;
      }
    });
    setGrid(newGrid);
    setUsedShips(updatedUsedShips);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col items-center p-4 bg-blue-900 min-h-screen">
        <h1 className="text-white text-2xl font-bold mb-4">DEPLOY YOUR SHIP</h1>
        <div className="grid grid-cols-10 gap-1 border border-blue-300">
          {grid.map((row, y) =>
            row.map((_, x) => (
              <Cell key={`${x}-${y}`} x={x} y={y} grid={grid} handleDrop={handleDrop} />
            ))
          )}
        </div>

        <div className="flex mt-6 gap-4 bg-blue-800 p-4 rounded-xl shadow-xl">
          {shipTypes.map((ship, idx) => (
            <Ship key={idx} ship={ship} index={idx} isUsed={usedShips[idx]} />
          ))}
        </div>

        <div className="mt-4 flex gap-4">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2">
            ✔ Confirm
          </button>
          <button
            onClick={autoPlaceShips}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Auto
          </button>
          <button
            onClick={() => setIsVertical(!isVertical)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Rotate: {isVertical ? "Vertical" : "Horizontal"}
          </button>
        </div>
      </div>
    </DndProvider>
  );
}
