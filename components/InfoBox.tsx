import React from "react";
import Card from "./Card";
import styles from "@/css/InfoBox.module.scss";

type InfoBoxProps = {
  cardClass?: string;
  title: string;
  count: string | number;
  icon: React.ReactNode;
};

const InfoBox: React.FC<InfoBoxProps> = ({ cardClass, title, count, icon }) => {
  return (
    <div className={styles["info-box"]}>
      <Card cardClass={cardClass}>
        <h4>{title}</h4>
        <span>
          <h3>{count}</h3>
          {icon}
        </span>
      </Card>
    </div>
  );
};

export default InfoBox;
