import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface FindDetailLinkProps {
  findId: number;
}

const FindDetailLink = ({ findId }: FindDetailLinkProps) => {
  return (
    <Link href={`/finds/${findId}`}>
      <Button variant="outline" className="bg-forest-green text-white hover:bg-meadow-green">
        View Find #{findId}
      </Button>
    </Link>
  );
};

export default FindDetailLink;