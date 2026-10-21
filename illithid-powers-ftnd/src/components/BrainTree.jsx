function BrainTree({ renderPower }) {
  return (
    <div className="absolute top-1/2 left-1/2 z-1 h-220 w-190 -translate-x-1/2 -translate-y-1/2">
      {/* Inner Circle */}
      <div className="relative top-[49%] left-[47%] w-fit">
        {renderPower("IllithidIdentification")}
      </div>
      <div className="relative top-[49%] left-[57%] w-fit">
        {renderPower("ForcePush")}
      </div>
      <div className="relative top-[29%] left-[57%] w-fit">
        {renderPower("KyarasInfluence")}
      </div>
      <div className="relative top-[35.5%] left-[37%] w-fit">
        {renderPower("MentalRejuvenation")}
      </div>
      <div className="relative top-[15.5%] left-[37%] w-fit">
        {renderPower("PsionicOverload")}
      </div>
      {/* Mid Circle */}
      <div className="relative top-[0.5%] left-[27%] w-fit">
        {renderPower("CullOfTheWeak")}
      </div>
      <div className="relative top-[29%] left-[47%] w-fit">
        {renderPower("DefensiveSwap")}
      </div>
      <div className="relative top-[17%] left-[68%] w-fit">
        {renderPower("ForceRepel")}
      </div>
      <div className="relative top-[-20%] left-[68%] w-fit">
        {renderPower("LuckOfTheFarRealms")}
      </div>
      <div className="relative top-[4%] left-[28%] w-fit">
        {renderPower("MentalShielding")}
      </div>
      <div className="relative top-[-19%] left-[73%] w-fit">
        {renderPower("PsionicBacklash")}
      </div>
      <div className="relative top-[-45%] left-[47%] w-fit">
        {renderPower("StageFright")}
      </div>
      <div className="relative top-[-32.8%] left-[22%] w-fit">
        {renderPower("TransfuseHealth")}
      </div>
      {/* Outer Circle */}
      <div className="relative top-[-14%] left-[17%] w-fit">
        {renderPower("AbsorbIntellect")}
      </div>
      <div className="relative top-[-21%] left-[80%] w-fit">
        {renderPower("BlackHole")}
      </div>
      <div className="relative top-[-88%] left-[47%] w-fit">
        {renderPower("Enthrall")}
      </div>
      <div className="relative top-[-84%] left-[15%] w-fit">
        {renderPower("ForcefulStrikes")}
      </div>
      <div className="relative top-[-66.5%] left-[90%] w-fit">
        {renderPower("Freecast")}
      </div>
      <div className="relative top-[-73.5%] left-[6%] w-fit">
        {renderPower("PsionicBeam")}
      </div>
      <div className="relative top-[-43%] left-[47%] w-fit">
        {renderPower("PsionicEscape")}
      </div>
      <div className="relative top-[-112%] left-[82%] w-fit">
        {renderPower("SecondChance")}
      </div>
    </div>
  );
}

export default BrainTree;
