import React, { useState, useEffect } from "react";
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

function Ship({ ship, index, isUsed, isVertical }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SHIP,
    item: { index, isVertical },
    canDrag: !isUsed,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }), [isUsed, isVertical]);

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
    drop: (item) => handleDrop(item.index, x, y, item.isVertical),
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

function BattlePage({ playerGrid, onBack }) {
  const [playerTurn, setPlayerTurn] = useState(true);
  const [playerShots, setPlayerShots] = useState([]);
  const [enemyGrid, setEnemyGrid] = useState(() => {
    let newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    shipTypes.forEach((ship) => {
      let placed = false;
      while (!placed) {
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);
        const vertical = Math.random() < 0.5;
        let canPlace = true;
        for (let i = 0; i < ship.size; i++) {
          const xi = vertical ? x : x + i;
          const yi = vertical ? y + i : y;
          if (xi >= gridSize || yi >= gridSize || newGrid[yi][xi]) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          for (let i = 0; i < ship.size; i++) {
            const xi = vertical ? x : x + i;
            const yi = vertical ? y + i : y;
            newGrid[yi][xi] = ship.name;
          }
          placed = true;
        }
      }
    });
    return newGrid;
  });

  const [playerHits, setPlayerHits] = useState([]);
  const [enemyHits, setEnemyHits] = useState([]);
  const [winner, setWinner] = useState(null);

  const checkSunkShips = (grid, hits) => {
    const shipCells = {};
    grid.forEach((row, y) => row.forEach((cell, x) => {
      if (cell) {
        shipCells[cell] = shipCells[cell] || [];
        shipCells[cell].push(`${x}-${y}`);
      }
    }));

    const hitPositions = hits.map(pos => `${pos.x}-${pos.y}`);
    const sunkShips = Object.entries(shipCells).filter(([_, positions]) =>
      positions.every(p => hitPositions.includes(p))
    ).flatMap(([_, positions]) => positions);

    return new Set(sunkShips);
  };

  const handlePlayerShot = (x, y) => {
    if (!playerTurn || playerShots.find(pos => pos.x === x && pos.y === y)) return;

    const isHit = enemyGrid[y][x];
    setPlayerShots(prev => [...prev, { x, y }]);
    if (isHit) {
      setPlayerHits(prev => [...prev, { x, y }]);
    } else {
      setPlayerTurn(false);
      setTimeout(() => aiTurn(), 1000);
    }
  };

  const aiTurn = () => {
    let x, y;
    do {
      x = Math.floor(Math.random() * gridSize);
      y = Math.floor(Math.random() * gridSize);
    } while (enemyHits.find(pos => pos.x === x && pos.y === y));

    const hit = playerGrid[y][x];
    setEnemyHits(prev => [...prev, { x, y }]);
    if (!hit) {
      setPlayerTurn(true);
    } else {
      setTimeout(() => aiTurn(), 1000);
    }
  };

  useEffect(() => {
    const totalEnemyShips = enemyGrid.flat().filter(cell => cell).length;
    const totalPlayerShips = playerGrid.flat().filter(cell => cell).length;
    if (playerHits.length === totalEnemyShips) setWinner("You Win!");
    if (enemyHits.filter(pos => playerGrid[pos.y][pos.x]).length === totalPlayerShips) setWinner("AI Wins!");
  }, [playerHits, enemyHits, enemyGrid, playerGrid]);

  const sunkEnemyCells = checkSunkShips(enemyGrid, playerHits);
  const sunkPlayerCells = checkSunkShips(playerGrid, enemyHits);

  const renderGrid = (grid, hits, clickable = false, sunkCells = new Set()) => (
    <div className="grid grid-cols-10 gap-1">
      {grid.map((row, y) =>
        row.map((_, x) => {
          const hit = hits.find(p => p.x === x && p.y === y);
          const isHit = hit && grid[y][x];
          const isSunk = sunkCells.has(`${x}-${y}`);
          return (
            <div
              key={`${x}-${y}`}
              onClick={clickable && !winner ? () => handlePlayerShot(x, y) : undefined}
              className={`w-8 h-8 border flex items-center justify-center text-xs cursor-pointer relative ${
                isHit ? "bg-red-600" : hit ? "bg-gray-500" : "bg-blue-400"
              }`}
            >
              {hit ? (isHit ? "💥" : "❌") : ""}
              {isSunk && <div className="absolute inset-0 border-2 border-white pointer-events-none"></div>}
            </div>
          );
        })
      )}
    </div>
  );

 return (
  <div className="flex flex-col items-center bg-blue-900 min-h-screen p-6 text-white">
    <h2 className="text-2xl font-bold mb-4">Battle Phase</h2>
    <h3 className="text-lg mb-2">{winner ? winner : playerTurn ? "Your Turn" : "Enemy Turn"}</h3>

    <div className="grid grid-cols-2 gap-10">
      <div>
        <h4 className="mb-2">Opponent Grid</h4>
        {renderGrid(enemyGrid, playerShots, true, sunkEnemyCells)}
      </div>
      <div>
        <h4 className="mb-2">Your Grid</h4>
        {renderGrid(playerGrid, enemyHits, false, sunkPlayerCells)}
      </div>
    </div>

    {/* Leave button always visible */}
    <button
      onClick={onBack}
      className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded shadow-md"
    >
      🚪 Leave Battle
    </button>

    {/* Restart button only if there's a winner */}
    {winner && (
      <button
        onClick={onBack}
        className="mt-4 bg-green-600 hover:bg-green-700 px-4 py-2 rounded shadow-md"
      >
        🔁 Restart
      </button>
    )}
  </div>
);

}

export default function DeployYourShip() {
  const [grid, setGrid] = useState(Array(gridSize).fill(null).map(() => Array(gridSize).fill(null)));
  const [isVertical, setIsVertical] = useState(false);
  const [usedShips, setUsedShips] = useState(Array(shipTypes.length).fill(false));
  const [startBattle, setStartBattle] = useState(false);

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

  const handleDrop = (shipIndex, x, y, vertical) => {
    if (usedShips[shipIndex]) return;
    const newGrid = [...grid.map(row => [...row])];
    const shipSize = shipTypes[shipIndex].size;
    let canPlace = canPlaceShip(newGrid, x, y, shipSize, vertical);

    if (canPlace) {
      placeShip(newGrid, x, y, shipSize, shipTypes[shipIndex].name, vertical);
      const updatedUsedShips = [...usedShips];
      updatedUsedShips[shipIndex] = true;
      setUsedShips(updatedUsedShips);
      setGrid(newGrid);
    } else {
      alert("Cannot place ship here.");
    }
  };

  const autoPlaceShips = () => {
    let newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
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

  if (startBattle) return <BattlePage playerGrid={grid} onBack={() => {
    setGrid(Array(gridSize).fill(null).map(() => Array(gridSize).fill(null)));
    setUsedShips(Array(shipTypes.length).fill(false));
    setStartBattle(false);
  }} />;

  return (
   <DndProvider backend={HTML5Backend}>
  <div className="flex flex-row justify-center p-4 bg-blue-900 min-h-screen text-white gap-10">

    {/* Left Side: Logo & Rules */}
    <div className="w-1/4 flex flex-col gap-6">
      <h1 className="text-4xl font-bold animate-pulse text-yellow-400 drop-shadow-lg tracking-wider">
        🚢 BATTLESHIP
      </h1>

      <div className="bg-blue-800 p-4 rounded-lg text-sm shadow-md">
        <h2 className="font-semibold text-lg mb-2">📝 Rules:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Drag and drop all ships onto the grid.</li>
          <li>Use the "Rotate" button to switch orientation before placing.</li>
          <li>Click "Auto" to place all ships randomly.</li>
          <li>Click "Confirm" when all ships are placed to start the battle.</li>
          <li>Sink all enemy ships before yours are sunk to win!</li>
        </ul>
      </div>
    </div>

    {/* Right Side: Grid & Controls */}
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">DEPLOY YOUR SHIP</h1>

      <div className="grid grid-cols-10 gap-1 border border-blue-300">
        {grid.map((row, y) =>
          row.map((_, x) => (
            <Cell key={`${x}-${y}`} x={x} y={y} grid={grid} handleDrop={handleDrop} />
          ))
        )}
      </div>

      <div className="flex mt-6 gap-4 bg-blue-800 p-4 rounded-xl shadow-xl">
        {shipTypes.map((ship, idx) => (
          <Ship key={idx} ship={ship} index={idx} isUsed={usedShips[idx]} isVertical={isVertical} />
        ))}
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => setStartBattle(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2"
        >
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
          Rotate: {isVertical ? "Horizontal" : "Vertical"}
        </button>
      </div>
    </div>
  </div>
</DndProvider>

  );
}
